export type HederaEcdsaPrivateKeyParser = {
  fromStringECDSA(value: string): unknown;
};

export function parseRiskScanHederaPayerPrivateKey(
  privateKeyParser: HederaEcdsaPrivateKeyParser,
  value: string,
) {
  return privateKeyParser.fromStringECDSA(value);
}
