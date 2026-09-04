import type { Metadata } from "next";
import Link from "next/link";
import { getProfile } from "@/lib/content";

export const metadata: Metadata = {
  title: "Privacy",
  alternates: { canonical: "/privacy/" },
};

export default function PrivacyPage() {
  const profile = getProfile();
  const { email } = profile.links;

  return (
    <main id="main">
      <article className="mx-auto max-w-3xl px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight">Privacy</h1>

        <p className="mt-4 max-w-prose">
          This page explains what happens to information you submit through this site.
        </p>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Analytics</h2>
          <p className="mt-2 max-w-prose">
            This site uses cookieless, privacy-respecting analytics. No cookies are set for tracking
            purposes and no consent banner is required.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Contact form</h2>
          <p className="mt-2 max-w-prose">
            The{" "}
            <Link href="/#contact" className="underline">
              contact form
            </Link>{" "}
            collects your name, email address, and message. When you submit it, that information is
            emailed directly to {profile.fullName} and is <strong>not stored</strong> by this
            application &mdash; there is no database of form submissions.
          </p>
          <p className="mt-2 max-w-prose">
            Sending the email involves a third-party email provider. That provider may keep its own
            delivery logs (for example, to detect abuse or deliver the message reliably); those logs
            are subject to the email provider&apos;s own retention policy, not this site&apos;s.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">Reach me directly</h2>
          <p className="mt-2 max-w-prose">
            If you would rather not use the form, you can email{" "}
            <a href={`mailto:${email}`} className="underline">
              {email}
            </a>{" "}
            directly, or use the{" "}
            <Link href="/#contact" className="underline">
              contact section
            </Link>{" "}
            for other ways to reach me.
          </p>
        </section>
      </article>
    </main>
  );
}
