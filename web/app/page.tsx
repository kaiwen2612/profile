import { getProfile } from "@/lib/content";
import { Hero } from "@/components/Hero";
import { LookingFor } from "@/components/LookingFor";
import { Section } from "@/components/Section";

export default function Home() {
  const profile = getProfile();
  return (
    <main id="main">
      <Hero profile={profile} />
      <Section id="looking-for" title="What I'm Looking For">
        <LookingFor lookingFor={profile.lookingFor} />
      </Section>
      {/* skills, projects, problem-solving, achievements, cv, contact added in later tasks */}
    </main>
  );
}
