import { render, screen } from "@testing-library/react";
import { CvSection } from "@/components/CvSection";

test("CV section offers a PDF download and links to the HTML CV", () => {
  render(<CvSection />);
  expect(screen.getByRole("link", { name: /download cv \(pdf\)/i })).toHaveAttribute("href", "/cv.pdf");
  expect(screen.getByRole("link", { name: /read the cv on this site|html/i })).toHaveAttribute("href", "/cv");
});
