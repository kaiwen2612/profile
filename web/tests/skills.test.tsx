import { render, screen } from "@testing-library/react";
import { SkillsSection } from "@/components/SkillsSection";
import { getSkills } from "@/lib/content";

test("renders every group with a context sentence and no proficiency meters", () => {
  const { groups } = getSkills();
  const { container } = render(<SkillsSection groups={groups} />);
  for (const g of groups) {
    expect(screen.getByRole("heading", { name: g.name })).toBeInTheDocument();
    expect(screen.getByText(g.context)).toBeInTheDocument();
  }
  expect(container.querySelector("progress, meter, [role='progressbar']")).toBeNull();
  expect(container.textContent).not.toMatch(/\d+\s?%/);
});

test("cloud services stay nested under AWS, not top-level", () => {
  const { groups } = getSkills();
  const cloud = groups.find((g) => /cloud/i.test(g.name))!;
  expect(cloud.skills.some((s) => /^AWS \(/.test(s))).toBe(true);
  expect(cloud.skills).not.toContain("S3");
  expect(cloud.skills).not.toContain("Step Functions");
});
