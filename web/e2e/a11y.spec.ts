import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const path of ["/", "/cv/", "/privacy/", "/404.html"]) {
  test(`no serious/critical a11y violations: ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
    expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
  });
}

test("no serious/critical a11y violations: a project page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /read the full case study/i }).first().click();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
  expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
});
