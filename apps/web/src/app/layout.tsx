import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tool402",
  description: "Tool402 web foundation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
