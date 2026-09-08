"use client";

import { ErrorBoundary } from "../components/boundary/error-boundary";

type ErrorRouteProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorRoute({ error: _error, reset }: ErrorRouteProps) {
  return <ErrorBoundary reset={reset} />;
}
