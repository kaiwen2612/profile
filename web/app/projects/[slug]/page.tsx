import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjects, getProject } from "@/lib/content";
import { CaseStudy } from "@/components/CaseStudy";

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.frontmatter.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const p = getProject(slug);
  if (!p) return {};
  return {
    title: p.frontmatter.title,
    description: p.frontmatter.summary,
    alternates: { canonical: `/projects/${p.frontmatter.slug}/` },
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return (
    <main id="main">
      <CaseStudy project={project} />
    </main>
  );
}
