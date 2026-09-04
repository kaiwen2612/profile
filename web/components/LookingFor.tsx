import type { Profile } from "@/lib/schemas";

export function LookingFor({ lookingFor }: { lookingFor: Profile["lookingFor"] }) {
  return (
    <div>
      <p>
        <span className="font-semibold">Role types: </span>
        {lookingFor.roleTypes.join(", ")}
      </p>
      <p className="mt-2">
        <span className="font-semibold">Domains: </span>
        {lookingFor.domains.join(", ")}
      </p>
      <p className="mt-2">
        <span className="font-semibold">Location: </span>
        {lookingFor.location}
      </p>
    </div>
  );
}
