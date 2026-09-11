import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";

export function NotFoundBoundary() {
  return (
    <main className="mx-auto max-w-3xl pb-6 sm:pb-12">
      <Card className="overflow-hidden">
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="space-y-5">
            <CardHeader className="space-y-3 p-0">
              <p className="text-sm font-medium text-muted-foreground">Not found</p>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                This page does not exist.
              </h1>
            </CardHeader>
            <CardContent className="space-y-5 p-0">
              <p className="max-w-xl leading-7 text-muted-foreground">
                The address may be incomplete or no longer available.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/"
                  className={buttonVariants()}
                >
                  Return home
                </Link>
                <Link
                  href="/explore"
                  className={buttonVariants({ variant: "outline" })}
                >
                  Explore tools
                </Link>
              </div>
            </CardContent>
          </div>
          <Image
            src="/brand/mascot-flag.png"
            alt=""
            width={288}
            height={288}
            className="mx-auto w-48 sm:w-60"
          />
        </div>
        <CardFooter className="text-sm text-muted-foreground">
          Use the local links above to continue.
        </CardFooter>
      </Card>
    </main>
  );
}
