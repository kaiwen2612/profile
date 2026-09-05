import { test, expect } from "@playwright/test";

test("Layer-1 content is in the served HTML and there are no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Software Engineering · AI/ML · Data · Cloud")).toBeVisible();
  // Both the #contact section and the Footer render a LinkedIn link; the
  // #contact one ("Connect on LinkedIn") comes first in DOM order.
  await expect(page.getByRole("link", { name: /linkedin/i }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
