import { getProfile } from "@/lib/content";

export function Footer() {
  const profile = getProfile();
  const { email, linkedin, github } = profile.links;

  return (
    <footer className="border-t border-[var(--fg)]/10 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm">
          © {new Date().getFullYear()} {profile.fullName}
        </p>
        <ul className="flex flex-wrap items-center gap-4 text-sm">
          <li>
            <a href="/cv.pdf" download className="flex min-h-11 items-center underline">
              Download CV (PDF)
            </a>
          </li>
          <li>
            <a href={`mailto:${email}`} className="flex min-h-11 items-center underline">
              Email
            </a>
          </li>
          <li>
            <a
              href={linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center underline"
            >
              LinkedIn
            </a>
          </li>
          <li>
            <a
              href={github}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-11 items-center underline"
            >
              GitHub
            </a>
          </li>
        </ul>
      </div>
    </footer>
  );
}
