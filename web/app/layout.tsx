import type { Metadata } from "next";
import { SkipLink } from "@/components/SkipLink";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { buildRootMetadata, personJsonLd } from "@/lib/metadata";
import "./globals.css";

export const metadata: Metadata = buildRootMetadata();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SkipLink />
        <Navbar />
        {children}
        <Footer />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }}
        />
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token":"REPLACE_ME"}'
        />
      </body>
    </html>
  );
}
