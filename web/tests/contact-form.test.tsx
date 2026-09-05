import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ContactForm } from "@/components/ContactForm";

const OWNER = "me@example.com";

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
}

test("client-side validation blocks submit and shows linked errors", async () => {
  vi.stubGlobal("fetch", mockFetch(200, { ok: true }));
  render(<ContactForm ownerEmail={OWNER} />);
  await userEvent.click(screen.getByRole("button", { name: /send message/i }));
  const nameErr = await screen.findByText(/enter your name/i);
  expect(screen.getByLabelText(/name/i)).toHaveAttribute("aria-describedby", nameErr.id);
  expect(fetch).not.toHaveBeenCalled();
});

test("happy path shows a success status and clears the form", async () => {
  vi.stubGlobal("fetch", mockFetch(200, { ok: true }));
  render(<ContactForm ownerEmail={OWNER} />);
  await userEvent.type(screen.getByLabelText(/name/i), "Ada");
  await userEvent.type(screen.getByLabelText(/email/i), "ada@example.com");
  await userEvent.type(screen.getByLabelText(/message/i), "I have a role you may like.");
  await userEvent.click(screen.getByRole("button", { name: /send message/i }));
  expect(await screen.findByRole("status")).toHaveTextContent(/sent/i);
});

test("privacy note stays visible after a successful submission", async () => {
  vi.stubGlobal("fetch", mockFetch(200, { ok: true }));
  render(<ContactForm ownerEmail={OWNER} />);
  await userEvent.type(screen.getByLabelText(/name/i), "Ada");
  await userEvent.type(screen.getByLabelText(/email/i), "ada@example.com");
  await userEvent.type(screen.getByLabelText(/message/i), "I have a role you may like.");
  await userEvent.click(screen.getByRole("button", { name: /send message/i }));
  await screen.findByRole("status");
  expect(screen.getByText(/emailed to me and not stored/i)).toBeInTheDocument();
});

test("server failure shows an alert AND a prefilled mailto fallback", async () => {
  vi.stubGlobal("fetch", mockFetch(502, { ok: false, error: "send_failed" }));
  render(<ContactForm ownerEmail={OWNER} />);
  await userEvent.type(screen.getByLabelText(/name/i), "Ada");
  await userEvent.type(screen.getByLabelText(/email/i), "ada@example.com");
  await userEvent.type(screen.getByLabelText(/message/i), "Hello there, this is my note.");
  await userEvent.click(screen.getByRole("button", { name: /send message/i }));
  const alert = await screen.findByRole("alert");
  const link = screen.getByRole("link", { name: new RegExp(OWNER) });
  expect(alert).toBeInTheDocument();
  expect(link.getAttribute("href")).toMatch(/^mailto:me@example\.com\?/);
  expect(link.getAttribute("href")).toContain(encodeURIComponent("Hello there, this is my note."));
});

test("privacy note is present", () => {
  vi.stubGlobal("fetch", mockFetch(200, { ok: true }));
  render(<ContactForm ownerEmail={OWNER} />);
  expect(screen.getByText(/emailed to me and not stored/i)).toBeInTheDocument();
});
