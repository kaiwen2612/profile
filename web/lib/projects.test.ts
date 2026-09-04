import { describe, expect, test } from "vitest";
import path from "node:path";
import { getProjects, getProject } from "@/lib/content";

const GOOD = path.resolve(__dirname, "../content");

describe("project loader", () => {
  test("loads >= 3 projects sorted by order", () => {
    const p = getProjects(GOOD);
    expect(p.length).toBeGreaterThanOrEqual(3);
    const orders = p.map((x) => x.frontmatter.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  test("every technology entry has a reason", () => {
    for (const proj of getProjects(GOOD)) {
      for (const t of proj.frontmatter.technologies) {
        expect(t.why.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test("every project body is 400–800 words", () => {
    for (const proj of getProjects(GOOD)) {
      expect(proj.wordCount).toBeGreaterThanOrEqual(400);
      expect(proj.wordCount).toBeLessThanOrEqual(800);
    }
  });

  test("at least one project states a measurable result (contains a digit)", () => {
    expect(getProjects(GOOD).some((p) => /\d/.test(p.frontmatter.result))).toBe(true);
  });

  test("getProject returns by slug", () => {
    const first = getProjects(GOOD)[0];
    expect(getProject(first.frontmatter.slug, GOOD)?.frontmatter.title).toBe(first.frontmatter.title);
  });
});
