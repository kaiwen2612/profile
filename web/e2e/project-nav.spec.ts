import { test, expect } from "@playwright/test";

test("home → project case study → GitHub link", async ({ page }) => {
  await page.goto("/");
  // Multiple ProjectCards each render a "Read the full case study" link;
  // any one of them leads to a valid case study page. The first (lowest
  // `order`) project has a githubUrl set in its frontmatter specifically so
  // this test can exercise CaseStudy.tsx's own conditional GitHub link.
  await page.getByRole("link", { name: /read the full case study/i }).first().click();
  await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // Scope to the case-study <article> (CaseStudy.tsx's root element) so this
  // only matches the project's own GitHub link, not Footer.tsx's site-wide
  // one (Footer renders on every route, which would otherwise let this
  // assertion pass without CaseStudy.tsx ever rendering a link of its own).
  const gh = page.locator("article").getByRole("link", { name: /github/i });
  await expect(gh).toHaveAttribute("href", /github\.com/);
});
