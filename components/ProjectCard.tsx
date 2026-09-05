import Link from "next/link";
import type { Project } from "@/lib/content";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="border-t border-[var(--muted)]/20 py-6">
      <h3 className="text-xl font-semibold">{project.title}</h3>
      <p className="mt-1">{project.summary}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {project.technologies.map((t) => t.name).join(" · ")}
      </p>
      <Link href={`/projects/${project.slug}/`} className="mt-2 inline-block py-2 underline">
        Read the full case study
      </Link>
      {project.githubUrl && (
        <a href={project.githubUrl} className="ml-4 inline-block py-2 underline">
          GitHub
        </a>
      )}
      {project.demoUrl && (
        <a href={project.demoUrl} className="ml-4 inline-block py-2 underline">
          Live demo
        </a>
      )}
    </article>
  );
}
