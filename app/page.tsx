import { getProfile, getSkills } from "@/lib/content";
import { SkillGroup } from "@/components/SkillGroup";

export default function Home() {
  const profile = getProfile();
  const skills = getSkills();
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header>
        <h1 className="text-4xl font-bold">{profile.fullName}</h1>
        <p className="mt-2 text-lg">{profile.identityLine}</p>
        <p className="mt-4 max-w-prose">{profile.intro}</p>
      </header>

      <section id="looking-for" className="mt-12">
        <h2 className="text-2xl font-semibold">What I&apos;m Looking For</h2>
        <p className="mt-2">
          {profile.lookingFor.roleTypes.join(", ")} — {profile.lookingFor.domains.join(", ")} —{" "}
          {profile.lookingFor.location}
        </p>
      </section>

      <section id="skills" className="mt-12">
        <h2 className="text-2xl font-semibold">Skills</h2>
        <div className="mt-4">
          {skills.map((g) => (
            <SkillGroup key={g.name} group={g} />
          ))}
        </div>
      </section>
    </main>
  );
}
