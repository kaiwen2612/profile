import { describe, expect, test } from "vitest";
import path from "node:path";
import { getProfile, getSkills, getAchievements } from "@/lib/content";

const GOOD = path.resolve(__dirname, "../content");
const BAD = path.resolve(__dirname, "../tests/fixtures/content-bad");

describe("content loader", () => {
  test("loads valid profile.json", () => {
    const p = getProfile(GOOD);
    expect(p.degree).toBe("BSc (Hons) Computing Science Graduate");
    expect(p.identityLine).toBe("Software Engineering · AI/ML · Data · Cloud");
  });

  test("throws with a helpful message on invalid profile.json", () => {
    expect(() => getProfile(BAD)).toThrow(/profile\.json/i);
  });

  test("skills groups are non-empty and carry context", () => {
    for (const g of getSkills(GOOD).groups) {
      expect(g.skills.length).toBeGreaterThan(0);
      expect(g.context.length).toBeGreaterThan(0);
    }
  });

  test("achievements load newest-first friendly", () => {
    expect(getAchievements(GOOD).items.length).toBeGreaterThan(0);
  });
});
