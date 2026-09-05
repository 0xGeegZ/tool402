# UI-S03 RiskScan Request-Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a truthful browser Try RiskScan flow that maps only actual local API response boundaries.

**Architecture:** Keep the new route server-rendered and isolate all browser behavior in a client request-flow component. A client-safe response adapter maps an injected `fetch` response into a closed union before React presents it; no browser code reads configuration, writes a payment header, or accesses a wallet/provider. The form submits the accepted Quick input to the existing local route, and it exposes no state that has not come from that request.

**Tech Stack:** Next.js 16.3.4 App Router with Cache Components, React 19.2.8, TypeScript 5.9.3, Node 22.21.1, and Node's built-in test runner.

**Spec:** [UI-S03 RiskScan request and protocol-state manifest](../../ui/UI-S03.md)

## Global Constraints

- Preserve `cacheComponents: true`; the route remains a static server route with a client leaf only for the submit interaction.
- Submit exactly `requestRef`, `subjectRef`, `context`, and boolean `identity`, `pricing`, `limitations`, and `evidence` declarations to `/api/riskscan` with JSON `POST`.
- Map only `503`, `400`, `402` with a nonempty `PAYMENT-REQUIRED` header, transport failure, unexpected responses, malformed success payloads, and validated Quick responses.
- A `402` is `payment_required`, never a paid, settled, completed, receipt, or evidence state. A returned Quick response is not payment or lifecycle evidence.
- Do not import `apps/web/src/lib/riskscan-x402.ts` into browser code or add configuration reads, wallet/signer/provider support, payment-header authoring/display, facilitator access, persistence, analytics, credentials, external links, or dependencies.
- Keep all output fixed except the validated Quick response fields; never display a raw payment header or unknown server payload.
- Use the existing local `Button`, `Card`, `Badge`, and token primitives. Keep every local Markdown reference resolvable.

---

### Task 1: Client-safe response-state adapter

**Files:**
- Create: `apps/web/src/components/riskscan/request/riskscan-request-state.ts`
- Test: `apps/web/tests/riskscan-request-state.test.mjs`

**Interfaces:**
- Consumes: type-only `RiskScanQuickInput` and `RiskScanQuickResult` from `@tool402/core`, plus the existing `POST /api/riskscan` response contract.
- Produces: `RiskScanRequestOutcome`, `RiskScanRequestSender`, and `submitRiskScanRequest(input, sender?)` for the client component.

- [ ] **Step 1: Write the failing adapter tests**

```js
test("maps a 402 with PAYMENT-REQUIRED into payment_required without exposing its value", async () => {
  const outcome = await submitRiskScanRequest(validInput(), async () =>
    new Response(null, {
      status: 402,
      headers: { "payment-required": "opaque-protocol-data" },
    }),
  );

  assert.deepEqual(outcome, { kind: "payment_required" });
});

test("rejects a malformed 200 payload instead of presenting it as Quick", async () => {
  const outcome = await submitRiskScanRequest(validInput(), async () =>
    Response.json({ disposition: "completed" }),
  );

  assert.deepEqual(outcome, { kind: "unexpected_response" });
});
```

Add independent tests for `503`, `400`, a `402` without a nonempty payment header, a thrown sender, an unrecognized status, and a full schema-valid Quick payload. Keep test senders injected; no test calls an external service.

- [ ] **Step 2: Run the focused adapter test to verify RED**

Run: `npm run test --workspace @tool402/web -- tests/riskscan-request-state.test.mjs`

Expected: FAIL because `riskscan-request-state.ts` and `submitRiskScanRequest` do not exist.

- [ ] **Step 3: Implement the smallest closed response mapper**

```ts
export type RiskScanRequestOutcome =
  | { kind: "unavailable" }
  | { kind: "payment_required" }
  | { kind: "invalid_request" }
  | { kind: "transport_failure" }
  | { kind: "unexpected_response" }
  | { kind: "quick_response"; result: RiskScanQuickResult };

export type RiskScanRequestSender = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

function isNonblankString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isRiskScanQuickResult(value: unknown): value is RiskScanQuickResult {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const result = value as Record<string, unknown>;
  return (
    isNonblankString(result.requestRef) &&
    isNonblankString(result.subjectRef) &&
    isNonblankString(result.context) &&
    (result.disposition === "needs_disclosure" || result.disposition === "disclosures_reported") &&
    Array.isArray(result.reasons) &&
    result.reasons.length > 0 &&
    result.reasons.every(isNonblankString) &&
    Array.isArray(result.limitations) &&
    result.limitations.length > 0 &&
    result.limitations.every(isNonblankString)
  );
}

export async function submitRiskScanRequest(
  input: RiskScanQuickInput,
  sender: RiskScanRequestSender = fetch,
): Promise<RiskScanRequestOutcome> {
  let response: Response;
  try {
    response = await sender("/api/riskscan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
  } catch {
    return { kind: "transport_failure" };
  }

  if (response.status === 503) return { kind: "unavailable" };
  if (response.status === 400) return { kind: "invalid_request" };
  if (response.status === 402) {
    return response.headers.get("payment-required")?.trim()
      ? { kind: "payment_required" }
      : { kind: "unexpected_response" };
  }
  if (response.status !== 200) return { kind: "unexpected_response" };

  try {
    const result: unknown = await response.json();
    return isRiskScanQuickResult(result)
      ? { kind: "quick_response", result }
      : { kind: "unexpected_response" };
  } catch {
    return { kind: "unexpected_response" };
  }
}
```

Use a local predicate that requires the full Quick result shape before returning `quick_response`. Return only fixed outcome objects for every failure path. The `402` branch must require a nonempty `payment-required` header but must not return or log it.

- [ ] **Step 4: Run the focused adapter test to verify GREEN**

Run: `npm run test --workspace @tool402/web -- tests/riskscan-request-state.test.mjs`

Expected: PASS with every documented boundary covered.

- [ ] **Step 5: Commit the adapter**

```bash
git add apps/web/src/components/riskscan/request/riskscan-request-state.ts apps/web/tests/riskscan-request-state.test.mjs
git commit -m "feat: Add RiskScan Request State Adapter"
```

### Task 2: Try route and truthful request presentation

**Files:**
- Create: `apps/web/src/app/explore/riskscan/try/page.tsx`
- Create: `apps/web/src/components/riskscan/request/riskscan-request-flow.tsx`
- Modify: `apps/web/src/components/riskscan/detail/riskscan-detail.tsx`
- Modify: `apps/web/tests/riskscan-detail.test.mjs`
- Test: `apps/web/tests/riskscan-try.test.mjs`

**Interfaces:**
- Consumes: `RiskScanRequestOutcome` and `submitRiskScanRequest` from Task 1; the accepted local Button/Card/Badge primitives; the existing `/api/riskscan` route.
- Produces: a static `/explore/riskscan/try` route with one client request-flow leaf and one local navigation link from the detail page.

- [ ] **Step 1: Write the failing focused UI contract**

```js
assert.match(source, /"use client"/);
assert.match(source, /<form[^>]*>/);
for (const field of ["requestRef", "subjectRef", "context", "identity", "pricing", "limitations", "evidence"]) {
  assert.match(source, new RegExp(`name=\\"${field}\\"`));
}
assert.match(source, /payment_required/);
assert.match(source, /No payment was made in this browser\./);
assert.doesNotMatch(source, /process\.env|wallet|signer|provider|receipt|evidenceRef|payment-required.*(textContent|innerHTML)/i);
assert.doesNotMatch(source, /https?:\/\/|mailto:|target=/i);
```

Add route and link assertions for `/explore/riskscan/try`, exact state feedback for unavailable/invalid/transport/unexpected boundaries, and static exclusions for a client payment header, runtime configuration, external URL, account, price, and claimed completion.

- [ ] **Step 2: Run the focused UI contract to verify RED**

Run: `npm run test --workspace @tool402/web -- tests/riskscan-try.test.mjs`

Expected: FAIL because the Try route and request-flow component do not exist.

- [ ] **Step 3: Implement the minimal route and form**

```tsx
type RiskScanRequestViewState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | RiskScanRequestOutcome;

function readQuickInput(data: FormData): RiskScanQuickInput {
  const field = (name: "requestRef" | "subjectRef" | "context") =>
    String(data.get(name) ?? "");

  return {
    requestRef: field("requestRef"),
    subjectRef: field("subjectRef"),
    context: field("context"),
    declarations: {
      identity: data.get("identity") === "on",
      pricing: data.get("pricing") === "on",
      limitations: data.get("limitations") === "on",
      evidence: data.get("evidence") === "on",
    },
  };
}

function RequestOutcome({ state }: { state: RiskScanRequestViewState }) {
  if (state.kind === "idle") return null;
  if (state.kind === "submitting") return <p aria-live="polite">Sending the request boundary.</p>;
  if (state.kind === "unavailable") return <p aria-live="polite">RiskScan is unavailable. No payment challenge or result was returned.</p>;
  if (state.kind === "payment_required") return <p aria-live="polite">A payment challenge was returned. No payment was made in this browser.</p>;
  if (state.kind === "invalid_request") return <p aria-live="polite">The request was rejected before a result. Check the fields and try again.</p>;
  if (state.kind === "transport_failure") return <p aria-live="polite">The request could not reach the service. No payment or result was confirmed.</p>;
  if (state.kind === "unexpected_response") return <p aria-live="polite">The service returned an unexpected response. No payment or result is shown.</p>;

  return (
    <section aria-live="polite">
      <h2>Quick endpoint response</h2>
      <p>{state.result.disposition}</p>
      <ul>{state.result.reasons.map((reason, index) => <li key={`${index}-${reason}`}>{reason}</li>)}</ul>
      <ul>{state.result.limitations.map((limitation, index) => <li key={`${index}-${limitation}`}>{limitation}</li>)}</ul>
    </section>
  );
}

export function RiskScanRequestFlow() {
  const [state, setState] = useState<RiskScanRequestViewState>({ kind: "idle" });

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setState({ kind: "submitting" });
    setState(await submitRiskScanRequest(readQuickInput(new FormData(event.currentTarget))));
  }

  return (
    <form onSubmit={onSubmit}>
      <label>Request reference<input name="requestRef" required maxLength={96} /></label>
      <label>Subject reference<input name="subjectRef" required maxLength={160} /></label>
      <label>Request context<textarea name="context" required maxLength={280} /></label>
      <fieldset>
        <legend>Caller-reported disclosures</legend>
        <label><input name="identity" type="checkbox" /> Identity disclosure</label>
        <label><input name="pricing" type="checkbox" /> Pricing disclosure</label>
        <label><input name="limitations" type="checkbox" /> Limitations disclosure</label>
        <label><input name="evidence" type="checkbox" /> Evidence disclosure</label>
      </fieldset>
      <Button type="submit" disabled={state.kind === "submitting"}>Check availability</Button>
      <RequestOutcome state={state} />
    </form>
  );
}
```

Define `RequestOutcome` in the same component file with the exact `RiskScanRequestViewState` input. It returns a polite live region for `submitting`, `unavailable`, `payment_required`, `invalid_request`, `transport_failure`, and `unexpected_response`; it returns no success-looking content for `idle`. A `payment_required` outcome says a challenge was returned and that no payment was made in this browser. Render a Quick result only from `quick_response`, label it as an endpoint response, and do not describe it as receipt, evidence, or completion. Use required native controls and the same maximum lengths as the core input contract; keep server validation authoritative.

Keep `page.tsx` server-rendered. Add only a labeled local `Link` from the accepted detail component to the Try route, and update its focused static test to permit that exact second local link.

- [ ] **Step 4: Run the focused UI contract to verify GREEN**

Run: `npm run test --workspace @tool402/web -- tests/riskscan-try.test.mjs tests/riskscan-detail.test.mjs`

Expected: PASS with the request form, response boundaries, local navigation, and exclusions proved.

- [ ] **Step 5: Run focused type and browser-ready checks**

Run:

```bash
npm run typecheck --workspace @tool402/web
npm run test --workspace @tool402/web
```

Expected: PASS. During subsequent root validation, start the app without RiskScan runtime configuration, submit a valid form in desktop and narrow viewports, and observe the explicit unavailable state only.

- [ ] **Step 6: Commit the route and presentation**

```bash
git add apps/web/src/app/explore/riskscan/try/page.tsx apps/web/src/components/riskscan/request/riskscan-request-flow.tsx apps/web/src/components/riskscan/detail/riskscan-detail.tsx apps/web/tests/riskscan-detail.test.mjs apps/web/tests/riskscan-try.test.mjs
git commit -m "feat: Add RiskScan Try Flow"
```

## Plan Self-Review

- Spec coverage: Task 1 covers every API-derived state and validates a success payload; Task 2 covers accessible browser presentation, exact request inputs, local navigation, and all forbidden client surfaces.
- Placeholder scan: no deferred implementation terms or unspecified test outcomes remain.
- Type consistency: Task 1 exports the exact response union and submit function Task 2 consumes; Task 2 combines that union with its local `idle` and `submitting` view states.
