import Link from "next/link";

import { buttonVariants } from "../ui/button";

import { Badge } from "../ui/badge";
import { Card, CardContent, CardHeader } from "../ui/card";
import { PageHeader } from "../ui/page-header";

const questions = [
  {
    question: "What is Tool402?",
    answer: "Tool402 is a Hedera testnet prototype for agent tool discovery. An agent can find a capability and inspect the current local route boundary. A configured 402 response is not evidence that payment completed.",
  },
  {
    question: "How does the Tool402 flow work?",
    answer: "The current RiskScan route flow is Discover → Request → a result or 402 Payment Required → inspect the boundary → choose the next step. A route does not turn a payment requirement into proof of settlement.",
  },
  {
    question: "What does RiskScan Quick assess?",
    answer: "RiskScan Quick assesses caller-supplied declarations about identity, pricing, limitations, and evidence. It is a bounded technical assessment, not financial, legal, insurance, identity, or security advice.",
  },
  {
    question: "What is x402?",
    answer: "x402 is the payment boundary used by a tool to say that payment is required before access. The native Hedera mode uses hedera:testnet, but the descriptor is the source of truth for the current host. Receiving a 402 challenge alone is not proof of a completed payment.",
  },
  {
    question: "What does the B03 consumer-agent path do?",
    answer: "Its non-payable preflight reads the descriptor, makes one unsigned initial request, and stops before payment construction, signing, retry, settlement, or result parsing. A paid B03 request remains a separate Human Ops testnet action.",
  },
  {
    question: "Can I back RiskScan?",
    answer: "Only when /explore/riskscan/back has an OPEN offering. It first prepares HEDERA_FUNDING, then asks MetaMask for a separate HBAR transfer on Hedera Testnet. A signature is not a payment, and note units are allocated only after the issuer signs the allocation.",
  },
  {
    question: "Does the Provider path deploy an ATS asset?",
    answer: "Not by opening the wizard, reviewing it, or signing one stage. The issuer wallet follows four separate stages: record the draft, prepare ATS_CREATE, create and attach the revenue-note candidate in MetaMask, then publish after the required receipt conditions. A relayed accepted signature is not an on-chain fact.",
  },
  {
    question: "What does World verification do?",
    answer: "The signed dashboard can request a World App Selfie Check for the connected Hedera Testnet account. It confirms a live person, not identity or KYC; when verified, the browser-bound result lasts 30 days. It is unavailable when the host is not configured.",
  },
  {
    question: "Is there a public MCP endpoint?",
    answer: "No. A public MCP endpoint is not part of the current local routes.",
  },
] as const;


export function DocumentationFaq() {
  return (
    <article className="mx-auto max-w-6xl">
      <section className="border-b border-border bg-muted/35 px-5 py-10 sm:px-8 sm:py-14">
        <div className="space-y-5">
          <Badge variant="outline" className="border-border bg-background">Current scope · FAQ</Badge>
          <PageHeader
            title="Frequently asked questions"
            description="Short answers about the current Tool402 routes and their boundaries."
          />
        </div>
      </section>

      <section aria-labelledby="faq-title" className="space-y-6 px-5 py-10 sm:px-8 sm:py-14">
        <div className="max-w-2xl space-y-2">
          <p className="text-sm font-semibold text-primary">Current local facts</p>
          <h2 id="faq-title" className="text-2xl font-bold tracking-tight">Read the boundary before the route</h2>
          <p className="max-w-prose text-base leading-7 text-muted-foreground">
            These answers describe the present prototype without adding a product claim or a new action.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {questions.map((item) => (
            <Card key={item.question} className="rounded-panel shadow-none">
              <CardHeader className="space-y-2">
                <h3 className="text-lg font-bold tracking-tight">{item.question}</h3>
              </CardHeader>
              <CardContent className="pt-0 text-sm leading-6 text-muted-foreground">
                {item.answer}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-wrap gap-3 border-t border-border pt-6">
          <Link href="/docs/api" className={buttonVariants({ variant: "outline", size: "lg", shape: "pill" })}>Read the API reference</Link>
          <Link href="/docs/riskscan" className={buttonVariants({ variant: "outline", size: "lg", shape: "pill" })}>Read the RiskScan guide</Link>
          <Link href="/docs/providers" className={buttonVariants({ variant: "outline", size: "lg", shape: "pill" })}>Read the Provider guide</Link>
        </div>
      </section>
    </article>
  );
}
