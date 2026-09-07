import {
  parseIngressEnvelope,
  type IngressEnvelope,
} from "../src/index.ts";

const envelope: IngressEnvelope = parseIngressEnvelope({
  keyId: "key-A",
  timestampUnixSeconds: "1735689600",
  requestNonce: "AbCdEfGhIjKlMnOpQrStUw",
  bodySha256: "a".repeat(64),
  signature: "B".repeat(42) + "A",
});

const seconds: bigint = envelope.timestampUnixSeconds;
const method: "POST" = envelope.method;
const path: "/internal/commands" = envelope.path;
void seconds;
void method;
void path;

// @ts-expect-error Parsed envelopes are readonly snapshots.
envelope.method = "POST";
