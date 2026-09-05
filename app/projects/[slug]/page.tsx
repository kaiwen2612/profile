import { notFound } from "next/navigation";
import { getProjects, getProject } from "@/lib/content";

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.slug }));
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">{project.title}</h1>
      <p className="mt-2 text-lg">{project.summary}</p>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Technologies</h2>
        <ul className="mt-2 list-disc pl-5">
          {project.technologies.map((t) => (
            <li key={t.name}>
              <strong>{t.name}</strong> — {t.why}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Key Decisions</h2>
        <ul className="mt-2 list-disc pl-5">
          {project.decisions.map((d) => (
            <li key={d.decision}>
              {d.decision} <span className="text-[var(--muted)]">(rejected: {d.rejectedAlternative})</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Result</h2>
        <p className="mt-2">{project.result}</p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">What I Learned</h2>
        <p className="mt-2">{project.learned}</p>
      </section>

      <div className="prose mt-8 max-w-none" dangerouslySetInnerHTML={{ __html: project.bodyHtml }} />

      <div className="mt-8">
        {project.githubUrl && (
          <a href={project.githubUrl} className="underline">
            GitHub
          </a>
        )}
        {project.demoUrl && (
          <a href={project.demoUrl} className="ml-4 underline">
            Live demo
          </a>
        )}
      </div>
    </main>
  );
}
