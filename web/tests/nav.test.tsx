import { render, screen } from "@testing-library/react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

test("navbar exposes all section anchors", () => {
  render(<Navbar />);
  for (const id of ["#skills", "#projects", "#problem-solving", "#achievements", "#cv", "#contact"]) {
    expect(screen.getByRole("link", { name: new RegExp(id.slice(1), "i") })).toHaveAttribute("href", id);
  }
});

test("footer has a CV download and 3 contact links that need no JS", () => {
  render(<Footer />);
  expect(screen.getByRole("link", { name: /download cv/i })).toHaveAttribute("href", "/cv.pdf");
  expect(screen.getByRole("link", { name: /linkedin/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /github/i })).toBeInTheDocument();
});
