import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import {
  profileSchema,
  skillsSchema,
  achievementsSchema,
  projectFrontmatterSchema,
  type Profile,
  type SkillGroup,
  type Achievement,
  type ProjectFrontmatter,
} from "./schemas";
import { renderMarkdown } from "./markdown";

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

export interface Project {
  frontmatter: ProjectFrontmatter;
  bodyHtml: string;
  wordCount: number;
}

function countWords(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function getProjects(dir: string = DEFAULT_DIR): Project[] {
  const projectsDir = path.join(dir, "projects");
  const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith(".md"));
  const projects = files.map((f) => {
    const { data, content } = matter(fs.readFileSync(path.join(projectsDir, f), "utf8"));
    const parsed = projectFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(`Invalid frontmatter in projects/${f}:\n${parsed.error.toString()}`);
    }
    const base = f.replace(/\.md$/, "");
    if (parsed.data.slug !== base) {
      throw new Error(`projects/${f}: slug "${parsed.data.slug}" must equal filename "${base}"`);
    }
    const words = countWords(content);
    if (words < 400 || words > 800) {
      throw new Error(`projects/${f}: body is ${words} words; spec §7.1 requires 400–800`);
    }
    return { frontmatter: parsed.data, bodyHtml: renderMarkdown(content), wordCount: words };
  });
  if (projects.length < 3) {
    throw new Error(`spec §3.1 requires ≥3 projects at launch; found ${projects.length}`);
  }
  return projects.sort((a, b) => a.frontmatter.order - b.frontmatter.order);
}

export function getProject(slug: string, dir: string = DEFAULT_DIR): Project | undefined {
  return getProjects(dir).find((p) => p.frontmatter.slug === slug);
}
