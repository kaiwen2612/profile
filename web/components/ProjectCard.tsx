import type { Project } from "@/lib/content";

export function ProjectCard({ project }: { project: Project }) {
  const { title, slug, summary, technologies, githubUrl, demoUrl } = project.frontmatter;
  return (
    <article aria-label={title} className="rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{summary}</p>
      <ul className="mt-3 flex flex-wrap gap-2">
        {technologies.map((tech) => (
          <li key={tech.name} className="text-xs text-gray-500">
            {tech.name}
          </li>
        ))}
      </ul>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <a href={`/projects/${slug}/`}>Read the full case study</a>
        {githubUrl && (
          <a href={githubUrl} target="_blank" rel="noreferrer">
            GitHub
          </a>
        )}
        {demoUrl && (
          <a href={demoUrl} target="_blank" rel="noreferrer">
            Live demo
          </a>
        )}
      </div>
    </article>
  );
}
