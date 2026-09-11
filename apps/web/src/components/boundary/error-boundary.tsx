"use client";

import Link from "next/link";

import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";

type ErrorBoundaryProps = {
  reset: () => void;
};

export function ErrorBoundary({ reset }: ErrorBoundaryProps) {
  return (
    <main className="mx-auto max-w-3xl pb-6 sm:pb-12">
      <Card className="max-w-xl">
        <CardHeader className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">Interrupted</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Something unexpected interrupted this page.
          </h1>
        </CardHeader>
        <CardContent>
          <p className="leading-7 text-muted-foreground">
            You can try the page again or return home.
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-3">
          <Button onClick={reset}>Try again</Button>
          <Link
            href="/"
            className="inline-flex min-h-10 items-center rounded-control border border-border px-4 text-sm font-medium transition-colors hover:bg-muted"
          >
            Return home
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
}
