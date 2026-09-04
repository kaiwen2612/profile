import { render, screen } from "@testing-library/react";
import { CaseStudy } from "@/components/CaseStudy";
import { getProjects } from "@/lib/content";

test("case study shows why-per-technology and the rejected alternative for each decision", () => {
  const project = getProjects()[0];
  render(<CaseStudy project={project} />);
  expect(screen.getByRole("heading", { level: 1, name: project.frontmatter.title })).toBeInTheDocument();
  for (const t of project.frontmatter.technologies) {
    expect(screen.getByText(new RegExp(t.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument();
    expect(screen.getByText(t.why)).toBeInTheDocument();
  }
  for (const d of project.frontmatter.decisions) {
    expect(screen.getByText(d.rejectedAlternative)).toBeInTheDocument();
  }
});
