import type { AtsCreateConfigurationProjection } from "./provider-deploy-state";

export const atsCreateConfiguration: AtsCreateConfigurationProjection = Object.freeze({
  network: "hedera:testnet",
  chainId: 296,
  subjectPublicId: "riskscan_revenue_note_demo",
  offeringVersion: "ats_demo_v1",
  registryRevision: "ats_sdk_8_0_0_testnet_v2",
  operationKind: "ATS_CREATE",
  targetKind: "EVM_ADDRESS",
  expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
  canonicalParametersHash: "39a4d53db2aa60dd40b50c97738f53a888fdadcb350e1e85984fbd4dd76abc9a",
  factoryHederaId: "0.0.9213391",
  resolverHederaId: "0.0.9212226",
});
