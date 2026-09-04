import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main">
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Page not found</h1>
        <p className="mt-4 max-w-prose mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
        </p>
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center underline">
          Back to home
        </Link>
      </div>
    </main>
  );
}
