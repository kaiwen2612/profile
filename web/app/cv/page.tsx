import type { Metadata } from "next";
import Link from "next/link";
import { getProfile } from "@/lib/content";

export const metadata: Metadata = {
  title: "CV",
  alternates: { canonical: "/cv/" },
};

export default function CvPage() {
  const profile = getProfile();

  return (
    <main id="main">
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight">Curriculum Vitae</h1>

        <p className="mt-4 max-w-prose">
          <strong>
            This is placeholder template content — replace with a real CV before launch (spec §4.6, §8.2).
          </strong>{" "}
          The sections below mirror the structure of the downloadable{" "}
          <a href="/cv.pdf" className="underline">
            PDF CV
          </a>{" "}
          so this page can be read by search engines and screen readers. Every entry here is a template
          and must be replaced with {profile.fullName}&apos;s real history.
        </p>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Education</h2>
          <dl className="mt-2 space-y-3">
            <div>
              <dt className="font-semibold">TEMPLATE PLACEHOLDER — degree title, institution</dt>
              <dd className="mt-1 max-w-prose">
                TEMPLATE PLACEHOLDER — dates attended, honors/classification, and relevant coursework
                go here.
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Experience</h2>
          <dl className="mt-2 space-y-3">
            <div>
              <dt className="font-semibold">TEMPLATE PLACEHOLDER — job title, employer, dates</dt>
              <dd className="mt-1 max-w-prose">
                TEMPLATE PLACEHOLDER — one or two sentences describing real responsibilities and
                outcomes at this role.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">TEMPLATE PLACEHOLDER — job title, employer, dates</dt>
              <dd className="mt-1 max-w-prose">
                TEMPLATE PLACEHOLDER — one or two sentences describing real responsibilities and
                outcomes at this role.
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Skills</h2>
          <p className="mt-2 max-w-prose">
            TEMPLATE PLACEHOLDER — a real CV would summarize key technical skills here; see the{" "}
            <Link href="/#skills" className="underline">
              Technical Skills
            </Link>{" "}
            section on the homepage for the current, structured list.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Certifications</h2>
          <p className="mt-2 max-w-prose">
            TEMPLATE PLACEHOLDER — list real certifications, issuing body, and date earned, or remove
            this section if none apply.
          </p>
        </section>
      </article>
    </main>
  );
}
