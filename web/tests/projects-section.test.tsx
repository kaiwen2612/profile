import { render, screen, within } from "@testing-library/react";
import { ProjectsSection } from "@/components/ProjectsSection";
import { getProjects } from "@/lib/content";

test("each card links to its case study and omits absent links", () => {
  const projects = getProjects();
  render(<ProjectsSection projects={projects} />);
  for (const p of projects) {
    const card = screen.getByRole("article", { name: p.frontmatter.title });
    expect(within(card).getByRole("link", { name: /read the full case study/i })).toHaveAttribute(
      "href",
      `/projects/${p.frontmatter.slug}/`,
    );
    if (!p.frontmatter.demoUrl) {
      expect(within(card).queryByRole("link", { name: /live demo/i })).toBeNull();
    }
  }
});
