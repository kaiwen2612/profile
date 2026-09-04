import { expect, test } from "vitest";
import sitemap from "@/app/sitemap";
import { getProjects } from "@/lib/content";

test("sitemap lists home, cv, privacy and every project", () => {
  const urls = sitemap().map((e) => e.url);
  expect(urls.some((u) => u.endsWith("/"))).toBe(true);
  expect(urls.some((u) => u.endsWith("/cv/") || u.endsWith("/cv"))).toBe(true);
  for (const p of getProjects()) {
    expect(urls.some((u) => u.includes(`/projects/${p.frontmatter.slug}`))).toBe(true);
  }
});
