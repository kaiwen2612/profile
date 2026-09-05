import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { getProfile } from "@/lib/content";
import "./globals.css";

const profile = getProfile();

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: `${profile.fullName} — ${profile.identityLine}`,
  description: profile.intro,
  openGraph: {
    title: profile.fullName,
    description: profile.intro,
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
