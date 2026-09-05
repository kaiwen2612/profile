import { test, expect } from "@playwright/test";

test("home → project case study → GitHub link", async ({ page }) => {
  await page.goto("/");
  // Multiple ProjectCards each render a "Read the full case study" link;
  // any one of them leads to a valid case study page.
  await page.getByRole("link", { name: /read the full case study/i }).first().click();
  await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // The template project content has no per-project githubUrl set, so the
  // GitHub link that resolves here is the site-wide one in the Footer
  // (rendered on every page) — still a real github.com URL.
  const gh = page.getByRole("link", { name: /github/i }).first();
  await expect(gh).toHaveAttribute("href", /github\.com/);
});
