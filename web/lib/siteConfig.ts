export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const CONTACT_API_URL =
  process.env.NEXT_PUBLIC_CONTACT_API_URL ?? "http://localhost:8080/api/contact";

// Fixed by spec §4.1 — do not vary anywhere else on the site.
export const DEGREE = "BSc (Hons) Computing Science Graduate";
export const IDENTITY_LINE = "Software Engineering · AI/ML · Data · Cloud";
