import type { SkillGroup as SkillGroupType } from "@/lib/schemas";
import { SkillGroup } from "@/components/SkillGroup";

export function SkillsSection({ groups }: { groups: SkillGroupType[] }) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <SkillGroup key={group.name} {...group} />
      ))}
    </div>
  );
}
