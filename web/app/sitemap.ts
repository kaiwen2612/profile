import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/siteConfig";
import { getProjects } from "@/lib/content";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now },
    { url: `${SITE_URL}/cv/`, lastModified: now },
    { url: `${SITE_URL}/privacy/`, lastModified: now },
  ];

  const projectEntries: MetadataRoute.Sitemap = getProjects().map((p) => ({
    url: `${SITE_URL}/projects/${p.frontmatter.slug}/`,
    lastModified: now,
  }));

  return [...staticEntries, ...projectEntries];
}
