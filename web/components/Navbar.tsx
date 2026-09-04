const LINKS: { href: string; label: string }[] = [
  { href: "#summary", label: "Summary" },
  { href: "#skills", label: "Skills" },
  { href: "#projects", label: "Projects" },
  { href: "#problem-solving", label: "Problem-Solving" },
  { href: "#achievements", label: "Achievements" },
  { href: "#cv", label: "CV" },
  { href: "#contact", label: "Contact" },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--fg)]/10 bg-[var(--bg)]/95 backdrop-blur">
      <nav aria-label="Primary" className="mx-auto max-w-5xl overflow-x-auto">
        <ul className="flex min-w-max items-center gap-1 px-4">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="flex min-h-11 items-center whitespace-nowrap px-3 text-sm font-medium hover:underline"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
