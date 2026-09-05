import type { Metadata } from "next";
import { SkipLink } from "@/components/SkipLink";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { buildRootMetadata, personJsonLd } from "@/lib/metadata";
import { CF_BEACON_TOKEN } from "@/lib/siteConfig";
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
        {CF_BEACON_TOKEN && (
          <script
            defer
            src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token":"${CF_BEACON_TOKEN}"}`}
          />
        )}
      </body>
    </html>
  );
}
