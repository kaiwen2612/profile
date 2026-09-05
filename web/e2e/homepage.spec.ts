import { test, expect } from "@playwright/test";

test("Layer-1 content is in the served HTML and there are no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");

  // Identity
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Software Engineering · AI/ML · Data · Cloud")).toBeVisible();

  // Skills summary — a real skill group and skill from content/skills.json,
  // scoped to #skills since "Python" also appears (as a substring of a
  // template technology name) inside a ProjectCard elsewhere on the page.
  const skills = page.locator("#skills");
  await expect(skills.getByRole("heading", { name: "Languages" })).toBeVisible();
  await expect(skills.getByText("Python", { exact: true })).toBeVisible();

  // "What I'm Looking For" — real content from content/profile.json's
  // lookingFor fields, scoped to #looking-for.
  const lookingFor = page.locator("#looking-for");
  await expect(lookingFor.getByText(/Replace with your location\/remote preference/i)).toBeVisible();

  // Contact — both the #contact section and the Footer render a LinkedIn
  // link; the #contact one ("Connect on LinkedIn") comes first in DOM order.
  await expect(page.getByRole("link", { name: /linkedin/i }).first()).toBeVisible();

  expect(errors).toEqual([]);
});
