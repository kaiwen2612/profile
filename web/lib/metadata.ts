import type { Metadata } from "next";
import { getProfile } from "./content";
import { SITE_URL, DEGREE, IDENTITY_LINE } from "./siteConfig";

export function buildRootMetadata(): Metadata {
  const p = getProfile();
  const title = `${p.fullName} — ${DEGREE}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s — ${p.fullName}` },
    description: p.intro,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: SITE_URL,
      title,
      description: `${IDENTITY_LINE}. ${p.intro}`,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: `${p.fullName} — ${IDENTITY_LINE}` }],
    },
    twitter: { card: "summary_large_image", title, description: p.intro, images: ["/og.png"] },
  };
}

export function personJsonLd() {
  const p = getProfile();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.fullName,
    jobTitle: DEGREE,
    url: SITE_URL,
    sameAs: [p.links.linkedin, p.links.github],
  };
}
