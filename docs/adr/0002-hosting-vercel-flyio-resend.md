# 0002 — Hosting: Vercel + Fly.io + Resend + Cloudflare Web Analytics

**Status:** accepted

## Context

The site is a static Next.js export (ADR 0001) plus one dynamic endpoint: the
Go contact service (`POST /api/contact`, spec §6.4). Task 27 needs to pick
where each piece runs, how the contact form actually sends email, how basic
traffic is measured, and how the static site's response headers get set —
without inventing a runtime server for what is otherwise a fully static site.

This ADR also records the JSON-LD/CSP approach (superseding the two options
sketched in the original Task 27 brief) and the operational alert mechanism
for contact-service failures.

## Decision: four vendor choices

**Vercel — static site hosting.**
The `web/` app is `next build`'s static export (`output: "export"`, see
`next.config.mjs`). Vercel serves static exports directly from its edge
network with automatic HTTPS, per-PR preview deployments, and a `vercel.json`
`headers` block for setting response headers on every route — no server
process to operate, no container to build. This is the natural fit for a
static-first Next.js project and keeps the "no read API" decision from ADR
0001 intact: Vercel never runs server code for the profile pages.

**Fly.io — the contact service.**
The contact service (`contact/`) is a small stateful-ish Go binary (in-memory
fixed-window rate limiter, `contact/ratelimit.go`) that needs a real always-on
process, not a serverless function that might cold-start a fresh rate-limit
table per invocation or per region. Fly.io runs the committed `Dockerfile` as
a single small machine close to users, with `fly secrets` for the email
credentials and `SITE_ORIGIN`, and a plain `curl /healthz` for a deploy smoke
test. It is deliberately a separate origin from the static site — the two
have entirely different lifecycles (the site rebuilds on every content PR;
the contact service redeploys only when its Go code or secrets change) — and
`web/vercel.json`'s CSP `connect-src` allow-lists that origin explicitly
(see below) rather than trying to route both through one host.

**Resend — outbound email.**
`contact/mailer_resend.go` already implements the Resend HTTP API
(`NewResendMailer`). Resend needs no SMTP server to run or secure, has a
generous free tier for a low-volume personal contact form, and its API key
is exactly the kind of secret Fly.io secrets are for. No alternative
(SMTP, SES, etc.) was evaluated further since the mailer interface
(`contact/mailer.go`) already targets Resend as the only concrete
implementation.

**Cloudflare Web Analytics — traffic measurement.**
A single `<script defer>` beacon (`web/app/layout.tsx`) with no cookies and
no first-party tracking script to maintain. It is free, does not require its
own server or database, and — critically for this project's CSP-first
posture — its beacon script and reporting endpoint are two fixed hostnames
(`static.cloudflareinsights.com`, `cloudflareinsights.com`) that can be named
exactly in `script-src` / `connect-src` rather than needing a broad
allowance. No cookie-consent banner is required because Cloudflare Web
Analytics does not set cookies or use any client-side state that
constitutes tracking under typical interpretations of consent requirements.

## Decision: inline JSON-LD with a CSP `sha256` hash (not an external file)

The original Task 27 brief sketched two ways to keep the site's `Person`
JSON-LD (`web/lib/metadata.ts` → `personJsonLd()`, task 9) compatible with a
strict `script-src` that has no `'unsafe-inline'`:

1. Emit `web/public/person.json` at build time and reference it via
   `<link rel="alternate" type="application/ld+json" href="/person.json" />`.
2. Keep the `<script type="application/ld+json">` inline in `layout.tsx` and
   allow it in CSP via a `'sha256-<hash>'` source expression.

**Decision: option 2 — keep it inline, allow it by hash.**

Option 1 was rejected: Google's structured-data tooling (Rich Results Test,
Search Console) parses JSON-LD from an inline `<script type="application/ld
+json">` block in the page itself. A `<link rel="alternate">` pointing at a
separate JSON file is not a supported way to publish JSON-LD — crawlers do
not fetch and interpret arbitrary linked JSON as structured data merely
because of a `rel="alternate"` hint. Shipping option 1 would have satisfied
CSP while silently breaking the actual purpose of the JSON-LD block (rich
snippets / knowledge panel eligibility), which is a worse trade than a
slightly more involved CSP.

Option 2 keeps the inline script exactly as Task 9 built it and instead
makes the *build* responsible for keeping CSP in sync with its exact
content:

- `web/scripts/generate-csp-hash.mjs` reads `web/content/profile.json`
  directly and reconstructs the exact object shape `personJsonLd()` builds
  (mirroring `web/lib/metadata.ts` field-for-field) and the exact
  serialization `layout.tsx` uses (`JSON.stringify(...)`, no inline
  import needed since the script runs outside Next's TS pipeline), then
  prints `sha256-<base64>` — the value CSP's `script-src` needs.
- That hash is a build artifact of the JSON-LD content, not a secret;
  it is checked into `web/vercel.json` directly rather than computed by a
  build step on Vercel, since `vercel.json`'s `headers` block is pure static
  configuration with no templating.
- **Consequence:** the hash must be regenerated whenever
  `web/content/profile.json`'s owner-editable fields change, because that
  changes the serialized JSON-LD string and therefore its hash. A CSP
  violation on page load (JSON-LD silently failing to execute, visible in
  the browser console and in Search Console structured-data reports) is the
  symptom if this step is forgotten. This is a manual step for now,
  documented in `README.md`'s Deploy section (`node scripts/generate-csp-hash.mjs`,
  then update `web/vercel.json`); it is not currently automated as a CI
  check, which is an accepted gap given how rarely the profile's core
  identity fields (name, degree, links) are expected to change post-launch.

This keeps the CSP strict — no `'unsafe-inline'` in `script-src` anywhere —
while never breaking what the JSON-LD block is actually for.

## Decision: 5xx alerting via the `ALERT` log marker

The contact service already logs a structured `ALERT contact send_failed`
line (`contact/main.go`, the `Deps.Alert` callback invoked from the handler
on mail-send failure) via `slog`'s JSON handler to stdout. Fly.io captures
all stdout/stderr from the running machine as its log stream
(`fly logs`), and Fly.io's log-based alerting (configured in the Fly.io
dashboard for the app, or via `fly.toml`/Fly's alerting integrations) can be
pointed at that literal `ALERT` marker to notify the site owner without
standing up a separate metrics/alerting stack. This deliberately reuses the
existing structured log line already emitted by the handler rather than
adding a new metrics endpoint, external APM agent, or a second Fly.io app —
the contact service's failure volume is expected to be low enough that a
log-line alert is proportionate to the risk.

**Consequence:** this alert exists only for the contact service (the one
piece of the system that is not static and can fail at request time). The
static site itself has no server-side 5xx to alert on — a broken static
page is a build-time/CI failure (already gated per Task 26), not a runtime
one.

## Consequences

- Two independent origins (Vercel for the site, Fly.io for
  `/api/contact`) means the CSP must explicitly allow the Fly.io origin in
  `connect-src` (`web/vercel.json`) — this is a real, visible line to update
  whenever the Fly.io app's hostname is chosen or changes, tracked in the
  README's Deploy runbook.
- No server-rendered pages anywhere in `web/` — Vercel never executes
  Next.js server code for this project, which keeps the attack surface and
  the hosting bill both close to zero.
- Cloudflare Web Analytics' token is not a secret, so it lives directly in
  `web/app/layout.tsx` as a placeholder (`REPLACE_ME`) to be filled in from
  the Cloudflare dashboard once analytics is switched on — no secret-manager
  plumbing needed for it.
- The CSP hash workflow trades a small amount of manual process (rerun a
  script, paste a hash) for a strict `script-src` with zero broad inline
  allowances — considered worth it for a public-facing personal site whose
  content changes rarely.
