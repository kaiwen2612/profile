export function CvSection() {
  return (
    <div className="flex flex-col items-start gap-4">
      <p className="max-w-prose">
        Get the full CV as a PDF, or read the same content as a page on this site.
      </p>
      <div className="flex flex-wrap gap-4">
        <a
          href="/cv.pdf"
          download
          className="flex min-h-11 items-center rounded-md border border-[var(--fg)]/20 px-4 py-2 underline"
        >
          Download CV (PDF)
        </a>
        <a href="/cv" className="flex min-h-11 items-center rounded-md border border-[var(--fg)]/20 px-4 py-2 underline">
          Read the CV on this site (HTML)
        </a>
      </div>
    </div>
  );
}
