import factoryArtifact from "@hashgraph/asset-tokenization-contracts/artifacts/contracts/factory/Factory.sol/Factory.json" with { type: "json" };
import { encodeFunctionData, type Address, type Hex } from "viem";
import {
  createProviderToolAtsConfiguration,
  type ProviderToolAtsCreateConfiguration,
} from "./provider-tool-ats-configuration.ts";

const zeroAddress = "0x0000000000000000000000000000000000000000" as Address;
const defaultAdminRole = `0x${"0".repeat(64)}` as Hex;
const addressPattern = /^0x[0-9a-f]{40}$/u;
const hashPattern = /^0x[0-9a-f]{64}$/u;

type ProviderToolReceiptExpectation = Readonly<{
  chainId: 296;
  sender: string;
  factory: string;
  input: Hex;
  transactionHash: string;
  asset: string;
}>;

function reject(): never {
  throw new TypeError("invalid provider-tool receipt expectation");
}

function canonicalAddress(value: unknown): string {
  if (typeof value !== "string" || !addressPattern.test(value)) return reject();
  return value;
}

function canonicalHash(value: unknown): string {
  if (typeof value !== "string" || !hashPattern.test(value)) return reject();
  return value;
}

/**
 * Re-encodes the exact Factory.deployBond calldata from the immutable Task 3
 * ATS configuration. This has no RPC dependency: corroboration compares a
 * receipt document against this local expectation before any READY transition.
 */
export function createProviderToolReceiptExpectation(input: Readonly<{
  configuration: ProviderToolAtsCreateConfiguration;
  transactionHash: string;
  asset: string;
}>): ProviderToolReceiptExpectation {
  const configuration = input.configuration;
  const parameters = configuration?.parameters;
  if (
    configuration?.chainId !== 296
    || configuration.network !== "hedera:testnet"
    || configuration.operationKind !== "ATS_CREATE"
    || configuration.expectedTarget !== "0xd1f118a40f3b02883d35909ef2517e7edd78379d"
    || configuration.resolverEvmAddress !== "0xba2d5fc2083a0b8f164c50e65d782087fba18e0a"
    || parameters === undefined
    || canonicalAddress(parameters.diamondOwnerAccount) !== "0xc89f87052c3e080b4a9b021d4930055031ef378e"
  ) return reject();

  const rebuilt = createProviderToolAtsConfiguration({
    toolPublicId: configuration.subjectPublicId,
    subjectPublicId: configuration.subjectPublicId,
    title: parameters.name,
    canonicalSignerAddress: parameters.diamondOwnerAccount,
  }).atsCreateConfiguration;
  if (configuration.canonicalParametersHash !== rebuilt.canonicalParametersHash) return reject();
  const admittedConfiguration = rebuilt;
  const rebuiltParameters = admittedConfiguration.parameters;

  const inputData = encodeFunctionData({
    abi: factoryArtifact.abi,
    functionName: "deployBond",
    args: [{
      security: {
        resolver: admittedConfiguration.resolverEvmAddress as Address,
        maxSupply: rebuiltParameters.numberOfUnits,
        resolverProxyConfiguration: { key: rebuiltParameters.configId, version: rebuiltParameters.configVersion },
        erc20MetadataInfo: {
          name: rebuiltParameters.name, symbol: rebuiltParameters.symbol, isin: rebuiltParameters.isin, decimals: rebuiltParameters.decimals,
        },
        rbacs: [{ role: defaultAdminRole, members: [rebuiltParameters.diamondOwnerAccount as Address] }],
        externalPauses: [], externalControlLists: [], externalKycLists: [],
        compliance: zeroAddress, identityRegistry: zeroAddress,
        arePartitionsProtected: rebuiltParameters.arePartitionsProtected,
        isMultiPartition: rebuiltParameters.isMultiPartition,
        isControllable: rebuiltParameters.isControllable,
        isWhiteList: rebuiltParameters.isWhiteList,
        clearingActive: rebuiltParameters.clearingActive,
        internalKycActivated: rebuiltParameters.internalKycActivated,
        erc20VotesActivated: rebuiltParameters.erc20VotesActivated,
      },
      bondDetails: {
        currency: rebuiltParameters.currency,
        nominalValue: rebuiltParameters.nominalValue,
        nominalValueDecimals: rebuiltParameters.nominalValueDecimals,
        startingDate: rebuiltParameters.startingDate,
        maturityDate: rebuiltParameters.maturityDate,
      },
      proceedRecipients: [],
      proceedRecipientsData: [],
    }, {
      regulationType: rebuiltParameters.regulationType,
      regulationSubType: rebuiltParameters.regulationSubType,
      additionalSecurityData: {
        countriesControlListType: rebuiltParameters.isCountryControlListWhiteList,
        listOfCountries: rebuiltParameters.countries,
        info: rebuiltParameters.info,
      },
    }],
  });
  return Object.freeze({
    chainId: 296,
    sender: rebuiltParameters.diamondOwnerAccount,
    factory: admittedConfiguration.expectedTarget,
    input: inputData,
    transactionHash: canonicalHash(input.transactionHash),
    asset: canonicalAddress(input.asset),
  });
}
