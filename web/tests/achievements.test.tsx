import { render, screen } from "@testing-library/react";
import { Timeline } from "@/components/Timeline";

const items = [
  { date: "2025-06", title: "BSc (Hons) Computing Science", detail: "First class." },
  { date: "2024-08", title: "Software Engineering Internship", detail: "12 weeks.", evidenceUrl: "https://example.com" },
];

test("timeline is an ordered list, newest first, with evidence links where present", () => {
  render(<Timeline items={items} />);
  const entries = screen.getAllByRole("listitem");
  expect(entries[0]).toHaveTextContent("2025-06");
  expect(entries[1]).toHaveTextContent("2024-08");
  expect(screen.getByRole("link", { name: /evidence/i })).toHaveAttribute("href", "https://example.com");
});
