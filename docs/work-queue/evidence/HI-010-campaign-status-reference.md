# HI-010 Campaign status reference

Human-owned reference packet for the `/provider` route, attached to the
HI-010 intake card. It records the one artboard of the human operator's
design canvas that applies to the Campaign status page in its absent state,
so the root can read it as a local file. The canvas itself is a published
Claude Code design artifact
(`https://claude.ai/code/artifact/5eb15b5b-5084-492a-84c5-41590498b791`);
nothing else from it is requested here.

## What this reference is

- Artboard: `Campaign · initial state, nothing admitted yet`
  (`CampaignEmpty.dc.html`, 1440 by 900).
- Route: `/provider`, the accepted UI-S17 Provider campaign status page, in
  the state where the offering and Directory reads both return `absent`.
- Composition, in order below the shared shell:
  1. The UI-S25 page header: eyebrow `Tool operator`, `h1` `Campaign
     status`, the UI-S25 description, and the two UI-S25 actions rendered as
     one primary and one outline button.
  2. One dashed empty-state panel, `No campaign yet`, with a short
     explanation, one primary action to the deploy wizard, and a four-step
     list of the campaign sequence.
  3. The UI-S17 state ribbon, rendered as two outline badges reading
     `No offering` and `No directory version`. These depart from the UI-S25
     sentence and belong to the gated successor slice, not to the S25
     integration.
  4. The UI-S17 `Next action` region with the UI-S25 absent sentence followed
     by one added sentence.
  5. The UI-S17 `Deployment evidence` region with the UI-S25 absent sentence
     followed by one added sentence.
  6. The UI-S17 `Active terms`, `Active directory`, and `Signer` cards in one
     three-column row that stacks at narrow widths. `Active terms` carries
     the UI-S25 absent sentence followed by one added sentence; the other two
     carry the sentence alone.
- The shell row at the top of the markup (logo and five navigation links) is
  context only. The shell belongs to the root's application-shell slice and
  is not part of this reference.

## What this reference is not

- The canvas's `Provider status · after OPEN` artboard is excluded. It shows
  the `Live testnet`, `Design sample`, `Connected`, and `New offering
  version` elements and the funding, units, paid-task, and balance tiles that
  the accepted UI-S17 manifest declines, and it carries sample records.
- Colours, radius, and type in the markup are the canvas's own tokens. The
  accepted UI-S00 shell tokens, `Badge`, `Card`, and `buttonVariants`
  primitives govern the implementation; the reference fixes composition and
  copy, not hex values.
- Steps 3 and 4 of the four-step list describe the MetaMask `deployBond`
  transaction and the Directory publication. No accepted source path can run
  them; the HI-010 card's Observation records why. The panel is therefore
  requested as a gated successor slice, not as part of the S25 integration.

## Copy

| Region | Text |
| --- | --- |
| Eyebrow | `Tool operator` |
| Title | `Campaign status` |
| Description | `Read the admitted offering and directory records for this campaign without advancing either one.` |
| Actions | `Open the deploy wizard` (primary, `/provider/deploy`), `Explore RiskScan` (outline, `/explore/riskscan`) |
| Empty-state kicker | `No campaign yet` |
| Empty-state title | `Raise against RiskScan's future revenue` |
| Empty-state body | `You operate a paid x402 tool. A campaign turns its next paid tasks into a revenue note on Hedera testnet that backers can fund in units. Nothing here exists until you sign it in MetaMask.` |
| Empty-state action | `Start the deploy wizard` (primary, `/provider/deploy`) |
| Step 01 | `Prepare the offering` / `Terms v1: target, unit price, routing. Sign offering.create.` |
| Step 02 | `Prepare the revenue note` / `Sign external.prepare · ATS_CREATE. Admission is checked before anything goes on-chain.` |
| Step 03 | `Create the note in MetaMask` / `One Hedera testnet transaction. The receipt is verified, not trusted.` |
| Step 04 | `Publish the directory` / `Directory v1 goes ACTIVE. Backers can now fund units.` |
| Ribbon badges | `No offering`, `No directory version` |
| Next action | `No admitted record exists yet. Prepare the offering in the deploy wizard.` |
| Deployment evidence | `No admitted record exists yet. Signed commands and verified receipts appear here in order once the first one lands.` |
| Active terms | `No admitted record exists yet.` then `A material change needs a separately signed offering and directory version.` |
| Active directory | `No admitted record exists yet.` |
| Signer | `No admitted record exists yet.` |

## Artboard markup

Verbatim from the canvas. Inline styles carry the layout; the class rules
follow the markup.

```html
<div style="min-height: 900px; display: flex; flex-direction: column; background: #faf6ec;">
  <header style="border-bottom: 1px solid #e7e0cd; background: #faf6ec;">
    <div style="max-width: 1152px; margin: 0 auto; min-height: 72px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 32px; box-sizing: border-box;">
      <img src="logo.png" alt="Tool402" style="height: 32px; width: auto; object-fit: contain;">
      <nav style="display: flex; align-items: center; gap: 4px;">
        <a class="navlink" href="#">Home</a>
        <a class="navlink" href="#">Explore</a>
        <a class="navlink" href="#">Workspace</a>
        <a class="navlink" href="#">Demo</a>
        <a class="navlink navlink-active" href="#">Campaign</a>
      </nav>
    </div>
  </header>

  <main style="max-width: 1152px; width: 100%; margin: 0 auto; padding: 40px 32px; box-sizing: border-box; display: flex; flex-direction: column; gap: 32px;">
    <!-- PageHeader (UI-S25): eyebrow · h1 · description · actions -->
    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; gap: 12px; max-width: 720px;">
        <span class="badge" style="border: 1px solid #e7e0cd; align-self: flex-start;">Tool operator</span>
        <h1 style="margin: 0; font-size: 36px; line-height: 1.1; font-weight: 600; letter-spacing: -0.02em;">Campaign status</h1>
        <p style="margin: 0; font-size: 16px; color: #6d6a7c;">Read the admitted offering and directory records for this campaign without advancing either one.</p>
      </div>
      <div style="display: flex; gap: 8px; flex-wrap: wrap;">
        <a class="btn btn-primary" href="#">Open the deploy wizard</a>
        <a class="btn btn-outline" href="#">Explore RiskScan</a>
      </div>
    </div>

    <!-- Initial state: nothing admitted yet -->
    <section style="border-radius: 16px; border: 1px dashed rgba(106,92,240,.45); background: #f4f1fb; padding: 28px; display: flex; gap: 28px; align-items: flex-start; flex-wrap: wrap;">
      <div style="display: flex; flex-direction: column; gap: 8px; flex: 1 1 380px; min-width: 0;">
        <span style="font-size: 12px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #6a5cf0;">No campaign yet</span>
        <span style="font-size: 20px; font-weight: 700; line-height: 1.2;">Raise against RiskScan's future revenue</span>
        <span style="color: #6d6a7c; max-width: 560px;">You operate a paid x402 tool. A campaign turns its next paid tasks into a revenue note on Hedera testnet that backers can fund in units. Nothing here exists until you sign it in MetaMask.</span>
        <a class="btn btn-primary" href="#" style="align-self: flex-start; margin-top: 8px;">Start the deploy wizard</a>
      </div>
      <ol style="margin: 0; padding: 0; list-style: none; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; flex: 1 1 380px;">
        <li class="card" style="padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start;"><span class="mono" style="font-size: 12px; color: #6a5cf0; font-weight: 700;">01</span><span><strong style="display: block; font-size: 13px;">Prepare the offering</strong><span style="font-size: 12px; color: #6d6a7c;">Terms v1: target, unit price, routing. Sign <span class="mono">offering.create</span>.</span></span></li>
        <li class="card" style="padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start;"><span class="mono" style="font-size: 12px; color: #6a5cf0; font-weight: 700;">02</span><span><strong style="display: block; font-size: 13px;">Prepare the revenue note</strong><span style="font-size: 12px; color: #6d6a7c;">Sign <span class="mono">external.prepare · ATS_CREATE</span>. Admission is checked before anything goes on-chain.</span></span></li>
        <li class="card" style="padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start;"><span class="mono" style="font-size: 12px; color: #6a5cf0; font-weight: 700;">03</span><span><strong style="display: block; font-size: 13px;">Create the note in MetaMask</strong><span style="font-size: 12px; color: #6d6a7c;">One Hedera testnet transaction. The receipt is verified, not trusted.</span></span></li>
        <li class="card" style="padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start;"><span class="mono" style="font-size: 12px; color: #6a5cf0; font-weight: 700;">04</span><span><strong style="display: block; font-size: 13px;">Publish the directory</strong><span style="font-size: 12px; color: #6d6a7c;">Directory v1 goes ACTIVE. Backers can now fund units.</span></span></li>
      </ol>
    </section>

    <!-- S17 regions in their absent state, same order as the accepted route -->
    <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
      <span class="badge" style="border: 1px solid #e7e0cd; color: #6d6a7c;">No offering</span>
      <span class="badge" style="border: 1px solid #e7e0cd; color: #6d6a7c;">No directory version</span>
    </div>

    <section style="display: flex; flex-direction: column; gap: 6px;">
      <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Next action</h2>
      <p style="margin: 0; color: #6d6a7c;">No admitted record exists yet. Prepare the offering in the deploy wizard.</p>
    </section>

    <section style="display: flex; flex-direction: column; gap: 6px;">
      <h2 style="margin: 0; font-size: 18px; font-weight: 600;">Deployment evidence</h2>
      <p style="margin: 0; color: #6d6a7c;">No admitted record exists yet. Signed commands and verified receipts appear here in order once the first one lands.</p>
    </section>

    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px;">
      <section class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 8px;">
        <h2 style="margin: 0; font-size: 16px; font-weight: 600;">Active terms</h2>
        <p style="margin: 0; color: #6d6a7c; font-size: 13px;">No admitted record exists yet.</p>
        <p style="margin: 0; font-size: 12px; color: #6d6a7c;">A material change needs a separately signed offering and directory version.</p>
      </section>
      <section class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 8px;">
        <h2 style="margin: 0; font-size: 16px; font-weight: 600;">Active directory</h2>
        <p style="margin: 0; color: #6d6a7c; font-size: 13px;">No admitted record exists yet.</p>
      </section>
      <section class="card" style="padding: 20px; display: flex; flex-direction: column; gap: 8px;">
        <h2 style="margin: 0; font-size: 16px; font-weight: 600;">Signer</h2>
        <p style="margin: 0; color: #6d6a7c; font-size: 13px;">No admitted record exists yet.</p>
      </section>
    </div>
  </main>
</div>
```

Class rules of the canvas stylesheet used by this artboard:

```css
    :root{--bg:#faf6ec;--fg:#16162a;--card:#ffffff;--primary:#5b4fe0;--muted:#f0ebdd;--muted-fg:#6d6a7c;--border:#e7e0cd;--purple:#6a5cf0;--green:#2fa876;--coral:#f0724a;--yellow:#f2b93c;--radius:13.6px;--font:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;--mono:ui-monospace,"SFMono-Regular",Menlo,monospace}
    body{margin:0;background:var(--bg);color:var(--fg);font-family:var(--font);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}
    a{color:var(--primary)} a:hover{color:var(--purple)}
    .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:0 16px;border-radius:var(--radius);font-weight:500;font-size:14px;border:1px solid transparent;cursor:pointer;font-family:inherit;color:var(--fg);background:transparent;text-decoration:none}
    .btn-primary{background:var(--primary);color:#ffffff} .btn-primary:hover{background:var(--purple)}
    .btn-outline{border-color:var(--border)} .btn-outline:hover{background:var(--muted)}
    .card{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);box-shadow:0 1px 2px rgba(0,0,0,.05)}
    .badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:2px 8px;font-size:12px;font-weight:500;white-space:nowrap}
    .mono{font-family:var(--mono);font-variant-numeric:tabular-nums;letter-spacing:-.02em}
    .navlink{padding:8px 12px;border-radius:var(--radius);font-size:14px;font-weight:500;color:var(--fg);text-decoration:none}
    .navlink:hover{background:var(--muted);color:var(--fg)}
    .navlink-active{background:var(--muted)}
```
