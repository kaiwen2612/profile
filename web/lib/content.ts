import fs from "node:fs";
import path from "node:path";
import {
  profileSchema,
  skillsSchema,
  achievementsSchema,
  type Profile,
  type SkillGroup,
  type Achievement,
} from "./schemas";

const DEFAULT_DIR = path.join(process.cwd(), "content");

function readJson(dir: string, file: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
}

export function getProfile(dir: string = DEFAULT_DIR): Profile {
  const parsed = profileSchema.safeParse(readJson(dir, "profile.json"));
  if (!parsed.success) {
    throw new Error(`Invalid content/profile.json:\n${parsed.error.toString()}`);
  }
  return parsed.data;
}

export function getSkills(dir: string = DEFAULT_DIR): { groups: SkillGroup[] } {
  const parsed = skillsSchema.safeParse(readJson(dir, "skills.json"));
  if (!parsed.success) {
    throw new Error(`Invalid content/skills.json:\n${parsed.error.toString()}`);
  }
  return parsed.data;
}

export function getAchievements(dir: string = DEFAULT_DIR): { items: Achievement[] } {
  const parsed = achievementsSchema.safeParse(readJson(dir, "achievements.json"));
  if (!parsed.success) {
    throw new Error(`Invalid content/achievements.json:\n${parsed.error.toString()}`);
  }
  parsed.data.items.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  return parsed.data;
}
