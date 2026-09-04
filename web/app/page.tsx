import { getProfile, getSkills, getProjects, getProblemSolvingTeasers, getAchievements } from "@/lib/content";
import { Hero } from "@/components/Hero";
import { LookingFor } from "@/components/LookingFor";
import { Section } from "@/components/Section";
import { SkillsSection } from "@/components/SkillsSection";
import { ProjectsSection } from "@/components/ProjectsSection";
import { ProblemSolvingTeasers } from "@/components/ProblemSolvingTeasers";
import { AchievementsSection } from "@/components/AchievementsSection";

export default function Home() {
  const profile = getProfile();
  const skills = getSkills();
  const projects = getProjects();
  const problemSolvingTeasers = getProblemSolvingTeasers();
  const achievements = getAchievements();
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
      <Section id="problem-solving" title="How I Solve Problems">
        <ProblemSolvingTeasers teasers={problemSolvingTeasers} />
      </Section>
      <Section id="achievements" title="Achievements & Experience">
        <AchievementsSection items={achievements.items} />
      </Section>
      {/* cv, contact added in later tasks */}
    </main>
  );
}
