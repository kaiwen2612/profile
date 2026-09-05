import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";

const CONTENT_DIR = path.join(process.cwd(), "content");
const md = new MarkdownIt({ html: false });

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

export type Project = {
  title: string;
  slug: string;
  summary: string;
  technologies: { name: string; why: string }[];
  decisions: { decision: string; rejectedAlternative: string }[];
  result: string;
  learned: string;
  githubUrl?: string;
  demoUrl?: string;
  order: number;
  bodyHtml: string;
};

export function getProjects(): Project[] {
  const dir = path.join(CONTENT_DIR, "projects");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  const projects = files.map((f) => {
    const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
    return { ...(data as Omit<Project, "bodyHtml">), bodyHtml: md.render(content) };
  });
  return projects.sort((a, b) => a.order - b.order);
}

export function getProject(slug: string): Project | undefined {
  return getProjects().find((p) => p.slug === slug);
}
