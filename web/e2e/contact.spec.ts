import { test, expect } from "@playwright/test";

const API = "**/api/contact";

// The homepage's ProjectCard articles carry aria-labels containing the word
// "Name" (e.g. "...Real Project Name..."), which getByLabel also matches.
// Scope to the #contact section so these locators resolve only to
// ContactForm's actual <label>-linked inputs.
function contactForm(page: import("@playwright/test").Page) {
  return page.locator("#contact");
}

test("happy path shows success", async ({ page }) => {
  await page.route(API, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
  await page.goto("/#contact");
  const form = contactForm(page);
  await form.getByLabel(/name/i).fill("Ada");
  await form.getByLabel(/email/i).fill("ada@example.com");
  await form.getByLabel(/message/i).fill("I have a role that may suit you well.");
  await form.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByRole("status")).toContainText(/sent/i);
});

test("client validation error blocks the request", async ({ page }) => {
  let called = false;
  await page.route(API, (r) => {
    called = true;
    r.fulfill({ status: 200, body: '{"ok":true}' });
  });
  await page.goto("/#contact");
  const form = contactForm(page);
  await form.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByText(/enter your name/i)).toBeVisible();
  expect(called).toBe(false);
});

test("server 502 shows alert and mailto fallback", async ({ page }) => {
  await page.route(API, (r) =>
    r.fulfill({ status: 502, contentType: "application/json", body: '{"ok":false,"error":"send_failed"}' }),
  );
  await page.goto("/#contact");
  const form = contactForm(page);
  await form.getByLabel(/name/i).fill("Ada");
  await form.getByLabel(/email/i).fill("ada@example.com");
  await form.getByLabel(/message/i).fill("Hello, here is my note to you.");
  await form.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("link", { name: /@/ })).toHaveAttribute("href", /^mailto:/);
});
