import { getProfile, getSkills, getProjects } from "@/lib/content";
import { SkillGroup } from "@/components/SkillGroup";
import { ProjectCard } from "@/components/ProjectCard";

export default function Home() {
  const profile = getProfile();
  const skills = getSkills();
  const projects = getProjects();
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <header>
        <h1 className="text-4xl font-bold">{profile.fullName}</h1>
        <p className="mt-2 text-lg">{profile.identityLine}</p>
        <p className="mt-4 max-w-prose">{profile.intro}</p>
      </header>

      <section id="looking-for" className="mt-12">
        <h2 className="text-2xl font-semibold">What I&apos;m Looking For</h2>
        <p className="mt-2 max-w-prose">
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

      <section id="projects" className="mt-12">
        <h2 className="text-2xl font-semibold">Projects</h2>
        <div className="mt-4">
          {projects.map((p) => (
            <ProjectCard key={p.slug} project={p} />
          ))}
        </div>
      </section>

      <section id="cv" className="mt-12">
        <h2 className="text-2xl font-semibold">CV</h2>
        <a href="/cv.pdf" download className="mt-2 inline-block py-2 underline">
          Download CV (PDF)
        </a>
      </section>

      <section id="contact" className="mt-12">
        <h2 className="text-2xl font-semibold">Contact</h2>
        <p className="mt-2">
          <a href={`mailto:${profile.links.email}`} className="inline-block py-2 underline">
            Email
          </a>
          <span className="mx-2">·</span>
          <a href={profile.links.linkedin} className="inline-block py-2 underline">
            LinkedIn
          </a>
          <span className="mx-2">·</span>
          <a href={profile.links.github} className="inline-block py-2 underline">
            GitHub
          </a>
        </p>
      </section>
    </main>
  );
}
