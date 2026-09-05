import type { SkillGroup as SkillGroupType } from "@/lib/content";

export function SkillGroup({ group }: { group: SkillGroupType }) {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold">{group.name}</h3>
      <p className="text-sm text-[var(--muted)]">{group.context}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {group.skills.map((s) => (
          <li key={s} className="rounded-full border border-[var(--muted)]/30 px-3 py-1 text-sm">
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}
