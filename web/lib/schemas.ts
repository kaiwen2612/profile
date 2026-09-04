import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(1),
  degree: z.literal("BSc (Hons) Computing Science Graduate"),
  identityLine: z.literal("Software Engineering · AI/ML · Data · Cloud"),
  intro: z.string().min(20).max(320),
  lookingFor: z.object({
    roleTypes: z.array(z.string().min(1)).min(1),
    domains: z.array(z.string().min(1)).min(1),
    location: z.string().min(1),
  }),
  links: z.object({
    email: z.string().email(),
    linkedin: z.string().url(),
    github: z.string().url(),
  }),
});
export type Profile = z.infer<typeof profileSchema>;

export const skillGroupSchema = z.object({
  name: z.string().min(1),
  context: z.string().min(1), // US-04: one sentence of real usage
  skills: z.array(z.string().min(1)).min(1),
});
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export const skillsSchema = z.object({ groups: z.array(skillGroupSchema).min(1) });

export const achievementSchema = z.object({
  date: z.string().regex(/^\d{4}(-\d{2})?$/), // YYYY or YYYY-MM
  title: z.string().min(1),
  detail: z.string().min(1),
  evidenceUrl: z.string().url().optional(),
});
export type Achievement = z.infer<typeof achievementSchema>;
export const achievementsSchema = z.object({ items: z.array(achievementSchema).min(1) });
