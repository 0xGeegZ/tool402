import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const appRoot = fileURLToPath(new URL("..", import.meta.url));

function readAppFile(path) {
  return readFile(join(appRoot, path), "utf8");
}

test("locks the RiskScan Try request and response boundary", async () => {
  const [page, flow, detail] = await Promise.all([
    readAppFile("src/app/explore/riskscan/try/page.tsx"),
    readAppFile("src/components/riskscan/request/riskscan-request-flow.tsx"),
    readAppFile("src/components/riskscan/detail/riskscan-detail.tsx"),
  ]);
  const clientSources = [page, flow].join("\n");

  assert.doesNotMatch(page, /["']use client["']/);
  assert.match(page, /<RiskScanRequestFlow\s*\/>/);
  assert.match(flow, /["']use client["']/);
  assert.match(flow, /<form[^>]*>/);

  for (const field of ["requestRef", "subjectRef", "context", "identity", "pricing", "limitations", "evidence"]) {
    assert.match(flow, new RegExp(`name=["']${field}["']`));
  }
  assert.match(flow, /name=["']requestRef["'][^>]*required[^>]*maxLength=\{96\}/);
  assert.match(flow, /name=["']subjectRef["'][^>]*required[^>]*maxLength=\{160\}/);
  assert.match(flow, /name=["']context["'][^>]*required[^>]*maxLength=\{280\}/);

  assert.match(flow, /payment_required/);
  assert.match(flow, /RiskScan is unavailable\. No payment challenge or result was returned\./);
  assert.match(flow, /A payment challenge was returned\. No payment was made in this browser\./);
  assert.match(flow, /The request was rejected before a result\. Check the fields and try again\./);
  assert.match(flow, /The request could not reach the service\. No payment or result was confirmed\./);
  assert.match(flow, /The service returned an unexpected response\. No payment or result is shown\./);
  assert.match(flow, /Quick endpoint response/);
  assert.match(flow, /This is only an endpoint response\. It is not payment or lifecycle evidence\./);
  assert.match(detail, /href=["']\/explore\/riskscan\/try["']/);

  assert.doesNotMatch(
    clientSources,
    /process\.env|wallet|signer|provider|receipt|evidenceRef|payment-required.*(?:textContent|innerHTML)/i,
  );
  assert.doesNotMatch(clientSources, /https?:\/\/|mailto:|target=/i);
  assert.doesNotMatch(clientSources, /\b(?:account|recipient|facilitator|price|network)\b/i);
  assert.doesNotMatch(clientSources, /\b(?:paid|settled|completed)\b/i);
  assert.doesNotMatch(clientSources, /headers\s*:|PAYMENT-REQUIRED/i);
});
