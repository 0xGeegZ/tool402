import { STAGE_B_ATS_CREATE_CANONICAL_PARAMETERS_HASH } from "./stage-b-ats-create-canonical-identity.ts";

export const stageBAtsCreateCommandProjection = Object.freeze({
  network: "hedera:testnet",
  chainId: 296,
  subjectPublicId: "riskscan_revenue_note_demo",
  operationKind: "ATS_CREATE",
  expectedTarget: "0xd1f118a40f3b02883d35909ef2517e7edd78379d",
  canonicalParametersHash: STAGE_B_ATS_CREATE_CANONICAL_PARAMETERS_HASH,
});
