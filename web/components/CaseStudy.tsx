import type { Project } from "@/lib/content";

export function CaseStudy({ project }: { project: Project }) {
  const {
    title,
    summary,
    problem,
    solution,
    technologies,
    contribution,
    decisions,
    result,
    learned,
    githubUrl,
    demoUrl,
    architectureImage,
    architectureImageAlt,
  } = project.frontmatter;

  return (
    <article className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      <p className="mt-4 max-w-prose text-lg">{summary}</p>

      <div className="mt-4 flex flex-wrap gap-4 text-sm">
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

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Problem</h2>
        <p className="mt-2 max-w-prose">{problem}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Solution</h2>
        <p className="mt-2 max-w-prose">{solution}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Technologies</h2>
        <dl className="mt-2 space-y-3">
          {technologies.map((tech) => (
            <div key={tech.name}>
              <dt className="font-semibold">{tech.name}</dt>
              <dd className="mt-1 max-w-prose">{tech.why}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">My Contribution</h2>
        <p className="mt-2 max-w-prose">{contribution}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Key Technical Decisions</h2>
        <dl className="mt-2 space-y-3">
          {decisions.map((d) => (
            <div key={d.decision}>
              <dt className="font-semibold">{d.decision}</dt>
              <dd className="mt-1 max-w-prose">
                Rejected alternative: <strong>{d.rejectedAlternative}</strong>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Results</h2>
        <p className="mt-2 max-w-prose">{result}</p>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">What I Learned</h2>
        <p className="mt-2 max-w-prose">{learned}</p>
      </section>

      <div
        className="prose mt-10 max-w-prose"
        dangerouslySetInnerHTML={{ __html: project.bodyHtml }}
      />

      {architectureImage && (
        <img
          className="mt-10 max-w-full"
          src={architectureImage}
          alt={architectureImageAlt}
          width="800"
          height="600"
          loading="lazy"
        />
      )}
    </article>
  );
}
