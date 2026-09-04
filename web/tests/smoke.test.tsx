import { render, screen } from "@testing-library/react";
import Page from "@/app/page";

test("homepage renders an h1", () => {
  render(<Page />);
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
});
