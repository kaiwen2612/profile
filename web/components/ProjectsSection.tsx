import type { Project } from "@/lib/content";
import { ProjectCard } from "@/components/ProjectCard";

export function ProjectsSection({ projects }: { projects: Project[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {projects.map((project) => (
        <ProjectCard key={project.frontmatter.slug} project={project} />
      ))}
    </div>
  );
}
