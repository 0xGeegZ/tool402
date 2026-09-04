import Image from "next/image";

import { cn } from "../ui/cn";

export type LogoProps = {
  className?: string;
};

export function Logo({ className }: LogoProps) {
  return (
    <Image
      src="/brand/logo-full.png"
      alt="Tool402"
      width={180}
      height={60}
      priority
      className={cn("h-8 w-auto object-contain", className)}
    />
  );
}
