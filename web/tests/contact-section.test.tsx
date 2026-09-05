import { render, screen } from "@testing-library/react";
import { ContactSection } from "@/components/ContactSection";
import { getProfile } from "@/lib/content";

test("contact section renders no-JS links plus the form", () => {
  const p = getProfile();
  render(<ContactSection profile={p} />);
  expect(screen.getByRole("link", { name: /email/i })).toHaveAttribute("href", `mailto:${p.links.email}`);
  expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute("href", p.links.linkedin);
  expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute("href", p.links.github);
  expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
});
