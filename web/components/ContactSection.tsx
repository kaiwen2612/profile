import { ContactForm } from "@/components/ContactForm";
import type { Profile } from "@/lib/schemas";

export function ContactSection({ profile }: { profile: Profile }) {
  const { email, linkedin, github } = profile.links;

  return (
    <div className="flex flex-col gap-8">
      <p className="max-w-prose">
        Reach out directly, or use the form below — either way works without JavaScript.
      </p>
      <ul className="flex flex-wrap gap-4">
        <li>
          <a
            href={`mailto:${email}`}
            className="flex min-h-11 items-center rounded-md border border-[var(--fg)]/20 px-4 py-2 underline"
          >
            Email me
          </a>
        </li>
        <li>
          <a
            href={linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center rounded-md border border-[var(--fg)]/20 px-4 py-2 underline"
          >
            Connect on LinkedIn
          </a>
        </li>
        <li>
          <a
            href={github}
            target="_blank"
            rel="noopener noreferrer"
            className="flex min-h-11 items-center rounded-md border border-[var(--fg)]/20 px-4 py-2 underline"
          >
            See my GitHub
          </a>
        </li>
      </ul>
      <ContactForm ownerEmail={email} />
    </div>
  );
}
