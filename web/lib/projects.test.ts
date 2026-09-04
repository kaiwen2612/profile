import { describe, expect, test } from "vitest";
import path from "node:path";
import { getProjects, getProject } from "@/lib/content";

const GOOD = path.resolve(__dirname, "../content");
const BAD_SLUG_MISMATCH = path.resolve(__dirname, "../tests/fixtures/projects-bad/slug-mismatch");
const BAD_WORD_COUNT = path.resolve(__dirname, "../tests/fixtures/projects-bad/word-count");
const BAD_TOO_FEW = path.resolve(__dirname, "../tests/fixtures/projects-bad/too-few");

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

describe("project loader — invalid content throws loudly", () => {
  test("throws when frontmatter slug does not match filename", () => {
    expect(() => getProjects(BAD_SLUG_MISMATCH)).toThrow(/slug/i);
  });

  test("throws when body word count is outside 400-800", () => {
    expect(() => getProjects(BAD_WORD_COUNT)).toThrow(/400.?800|words/i);
  });

  test("throws when fewer than 3 project files exist", () => {
    expect(() => getProjects(BAD_TOO_FEW)).toThrow(/(?:≥|>=|at least)\s*3|3 projects/i);
  });
});
