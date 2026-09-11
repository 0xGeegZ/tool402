export const PROTECTED_JSON_MAX_BYTES = 65_536;

export type BoundedRequestJson =
  | Readonly<{ kind: "value"; value: unknown }>
  | Readonly<{ kind: "invalid" }>
  | Readonly<{ kind: "too_large" }>;

export async function readBoundedRequestJson(
  request: Request,
): Promise<BoundedRequestJson> {
  if (request.body === null) return { kind: "invalid" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > PROTECTED_JSON_MAX_BYTES) {
        void reader.cancel().catch(() => undefined);
        return { kind: "too_large" };
      }
      chunks.push(value);
    }
  } catch {
    return { kind: "invalid" };
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return {
      kind: "value",
      value: JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)),
    };
  } catch {
    return { kind: "invalid" };
  }
}
