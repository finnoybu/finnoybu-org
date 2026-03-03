import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Domain Integrity Engine",
  description: "Domain integrity monitoring for RDAP, DNS, and SSL/TLS signals",
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
