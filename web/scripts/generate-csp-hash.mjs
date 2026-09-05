// Computes the CSP `script-src` sha256 hash for the inline JSON-LD <script>
// block that web/app/layout.tsx renders via `personJsonLd()` from
// web/lib/metadata.ts.
//
// This script is plain Node (.mjs) run outside Next's TS/bundler pipeline, so
// rather than importing the compiled lib it re-reads web/content/profile.json
// directly and reconstructs the *exact* same object shape personJsonLd()
// builds (see web/lib/metadata.ts) and serializes it the *exact* same way
// layout.tsx does (`JSON.stringify(personJsonLd())`, no spacing/indentation
// args) before hashing. If either the object shape in metadata.ts or the
// serialization in layout.tsx changes, this script must be updated to match.
//
// Usage: node scripts/generate-csp-hash.mjs
// Prints: sha256-<base64>
//
// Must be re-run (and web/vercel.json's script-src updated) whenever
// web/content/profile.json's owner-editable fields change, since that
// changes the JSON-LD content and therefore its hash. See README.md.

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");

// Mirrors web/lib/siteConfig.ts: SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Mirrors web/lib/siteConfig.ts DEGREE (spec §4.1 — fixed, not sourced from profile.json).
const DEGREE = "BSc (Hons) Computing Science Graduate";

const profile = JSON.parse(
  readFileSync(join(webRoot, "content", "profile.json"), "utf8")
);

// Mirrors web/lib/metadata.ts personJsonLd() field-for-field, same order.
function personJsonLd(p) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.fullName,
    jobTitle: DEGREE,
    url: SITE_URL,
    sameAs: [p.links.linkedin, p.links.github],
  };
}

// Mirrors web/app/layout.tsx: JSON.stringify(personJsonLd())
const serialized = JSON.stringify(personJsonLd(profile));

const hash = createHash("sha256").update(serialized, "utf8").digest("base64");

console.log(`sha256-${hash}`);
