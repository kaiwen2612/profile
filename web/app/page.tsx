import { getProfile, getSkills, getProjects } from "@/lib/content";
import { Hero } from "@/components/Hero";
import { LookingFor } from "@/components/LookingFor";
import { Section } from "@/components/Section";
import { SkillsSection } from "@/components/SkillsSection";
import { ProjectsSection } from "@/components/ProjectsSection";

export default function Home() {
  const profile = getProfile();
  const skills = getSkills();
  const projects = getProjects();
  return (
    <main id="main">
      <Hero profile={profile} />
      <Section id="looking-for" title="What I'm Looking For">
        <LookingFor lookingFor={profile.lookingFor} />
      </Section>
      <Section id="skills" title="Technical Skills">
        <SkillsSection groups={skills.groups} />
      </Section>
      <Section id="projects" title="Selected Projects">
        <ProjectsSection projects={projects} />
      </Section>
      {/* problem-solving, achievements, cv, contact added in later tasks */}
    </main>
  );
}
