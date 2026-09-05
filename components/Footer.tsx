import { getProfile } from "@/lib/content";

export function Footer() {
  const { links } = getProfile();
  return (
    <footer className="mx-auto max-w-3xl px-4 py-12 text-sm text-[var(--muted)]">
      <a href="/cv.pdf" download className="inline-block py-2 underline">
        Download CV (PDF)
      </a>
      <span className="mx-2">·</span>
      <a href={`mailto:${links.email}`} className="inline-block py-2 underline">
        Email
      </a>
      <span className="mx-2">·</span>
      <a href={links.linkedin} className="inline-block py-2 underline">
        LinkedIn
      </a>
      <span className="mx-2">·</span>
      <a href={links.github} className="inline-block py-2 underline">
        GitHub
      </a>
    </footer>
  );
}
