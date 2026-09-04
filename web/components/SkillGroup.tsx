import type { SkillGroup as SkillGroupType } from "@/lib/schemas";

export function SkillGroup({ name, context, skills }: SkillGroupType) {
  return (
    <div>
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-1 text-sm text-gray-600">{context}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {skills.map((skill) => (
          <li key={skill}>{skill}</li>
        ))}
      </ul>
    </div>
  );
}
