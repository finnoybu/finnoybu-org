import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Finnoybu Domain Snapshot Tool",
  description: "Domain Governance Snapshot Tool - Query RDAP, DNS, and SSL information",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
