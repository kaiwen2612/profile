import { DEGREE, IDENTITY_LINE } from "@/lib/siteConfig";
import type { Profile } from "@/lib/schemas";

export function Hero({ profile }: { profile: Profile }) {
  return (
    <header id="summary" className="mx-auto max-w-3xl px-4 pt-20 pb-12">
      <h1 className="text-4xl font-bold tracking-tight">{profile.fullName}</h1>
      <p className="mt-2 text-lg">{DEGREE}</p>
      <p className="mt-1 text-[var(--muted)]">{IDENTITY_LINE}</p>
      <p className="mt-4 max-w-prose">{profile.intro}</p>
    </header>
  );
}
