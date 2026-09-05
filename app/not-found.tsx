import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <Link href="/" className="mt-4 inline-block underline">
        Back to home
      </Link>
    </main>
  );
}
