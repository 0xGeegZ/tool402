import type { ExternalPreparePayload } from "@tool402/core";

import { createStageBIssuerAtsCreateAuthority } from "../src/ats/stage-b-issuer-ats-create-authority.ts";

type NormalizedAtsCreateCommand = Readonly<{
  canonicalSignerAddress: string;
  principalPublicId: string;
  role: "ISSUER" | "BACKER";
  authorityVersion: string;
  payload: ExternalPreparePayload;
}>;

function reject(): never {
  throw new TypeError("invalid Stage B ATS_CREATE runtime binding");
}

export function assertStageBAtsCreateRuntimeBinding(
  command: NormalizedAtsCreateCommand,
): void {
  const {
    plannedCommandAuthority,
    atsCreateConfiguration,
    canonicalParametersHash,
  } = createStageBIssuerAtsCreateAuthority();

  if (
    plannedCommandAuthority.canonicalSignerAddress
      !== atsCreateConfiguration.parameters.diamondOwnerAccount
    || command.canonicalSignerAddress
      !== plannedCommandAuthority.canonicalSignerAddress
    || command.principalPublicId
      !== plannedCommandAuthority.principalPublicId
    || command.role !== "ISSUER"
    || command.role !== plannedCommandAuthority.role
    || command.authorityVersion
      !== plannedCommandAuthority.authorityVersion
    || command.payload.network !== atsCreateConfiguration.network
    || command.payload.chainId !== atsCreateConfiguration.chainId
    || command.payload.subjectPublicId
      !== atsCreateConfiguration.subjectPublicId
    || command.payload.operationKind !== "ATS_CREATE"
    || command.payload.operationKind
      !== atsCreateConfiguration.operationKind
    || command.payload.expectedTarget
      !== atsCreateConfiguration.expectedTarget
    || command.payload.canonicalParametersHash !== canonicalParametersHash
    || command.payload.canonicalParametersHash
      !== atsCreateConfiguration.canonicalParametersHash
  ) reject();
}
