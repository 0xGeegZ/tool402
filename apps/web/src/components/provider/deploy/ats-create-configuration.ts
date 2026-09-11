import type { AtsCreateConfigurationProjection } from "./provider-deploy-state";
import { STAGE_B_ATS_CREATE_CANONICAL_PARAMETERS_HASH } from "../../../lib/ats/stage-b-ats-create-canonical-identity.ts";

export const atsCreateConfiguration: AtsCreateConfigurationProjection = Object.freeze({
  network: "hedera:testnet",
  chainId: 296,
  subjectPublicId: "riskscan_revenue_note_demo",
  offeringVersion: "ats_demo_v1",
  registryRevision: "ats_sdk_8_0_0_testnet_v2",
  operationKind: "ATS_CREATE",
  targetKind: "EVM_ADDRESS",
  expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
  canonicalParametersHash: STAGE_B_ATS_CREATE_CANONICAL_PARAMETERS_HASH,
  factoryHederaId: "0.0.9213391",
  resolverHederaId: "0.0.9212226",
  revenueNote: Object.freeze({
    name: "Tool402 RiskScan Revenue Note Demo",
    symbol: "T402RN",
    isin: "XS402RISKN02",
    numberOfUnits: "1000",
    nominalValue: "1",
    currency: "0x555344",
    decimals: 0,
    isWhiteList: true,
    isControllable: false,
  }),
});
