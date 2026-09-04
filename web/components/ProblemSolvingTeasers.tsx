import type { ProblemSolvingTeaser } from "@/lib/schemas";

export function ProblemSolvingTeasers({ teasers }: { teasers: ProblemSolvingTeaser[] }) {
  return (
    <div className="space-y-6">
      {teasers.map((t) => (
        <div key={t.title}>
          <h3 className="text-lg font-semibold">{t.title}</h3>
          <p className="mt-1 text-neutral-700 dark:text-neutral-300">{t.teaser}</p>
        </div>
      ))}
    </div>
  );
}
