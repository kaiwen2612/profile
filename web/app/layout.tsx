import type { Metadata } from "next";
import { SkipLink } from "@/components/SkipLink";
import "./globals.css";

export const metadata: Metadata = {
  title: "Profile site",
  description: "Personal profile site",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SkipLink />
        {children}
      </body>
    </html>
  );
}
