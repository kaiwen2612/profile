import fs from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.join(process.cwd(), "content");

export type Profile = {
  fullName: string;
  identityLine: string;
  intro: string;
  lookingFor: { roleTypes: string[]; domains: string[]; location: string };
  links: { email: string; linkedin: string; github: string };
};

export type SkillGroup = {
  name: string;
  context: string;
  skills: string[];
};

export function getProfile(): Profile {
  return JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, "profile.json"), "utf8"));
}

export function getSkills(): SkillGroup[] {
  return JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, "skills.json"), "utf8")).groups;
}
