import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/Hero";
import { getProfile } from "@/lib/content";

test("hero shows the one h1 and the fixed identity lines", () => {
  const p = getProfile();
  render(<Hero profile={p} />);
  const h1 = screen.getAllByRole("heading", { level: 1 });
  expect(h1).toHaveLength(1);
  expect(h1[0]).toHaveTextContent(p.fullName);
  expect(screen.getByText("BSc (Hons) Computing Science Graduate")).toBeInTheDocument();
  expect(screen.getByText("Software Engineering · AI/ML · Data · Cloud")).toBeInTheDocument();
  expect(screen.getByText(p.intro)).toBeInTheDocument();
});
