# Personal Profile Site

Static Next.js profile site + a small Go contact service. See `profile-site-specifications.md`.

## Licence

Code is MIT (see `LICENSE`). Case-study prose, the CV, and images under `web/content/` and
`web/public/` are **all rights reserved** and not covered by the MIT licence.

## Setup

- Prereqs: Node 22 + pnpm, Go 1.23.
- Frontend: `cd web && pnpm install && pnpm dev`
- Contact service: `cd contact && cp .env.example .env && go run .`

## Testing

- Frontend unit: `cd web && pnpm test`
- E2E + a11y: `cd web && pnpm test:e2e`
- Lighthouse budgets: `cd web && pnpm lhci`
- Contact service: `cd contact && go test ./...`

## Architecture

Content is JSON/Markdown compiled into a static build at build time — no read API.
Only `POST /api/contact` is dynamic (Go service). See `docs/adr/`.

## Deploy

Hosting is split across three vendors: the static site on **Vercel**, the
contact service on **Fly.io**, outbound email via **Resend**, plus
**Cloudflare Web Analytics** for traffic. See `docs/adr/0002-hosting-vercel-flyio-resend.md`
for why. Local config for this (`web/vercel.json`, the CSP hash script, the
analytics beacon tag) is already committed; everything below requires the
site owner's own cloud accounts and has **not** been run by any automated
agent — follow it by hand.

### 1. Push to GitHub

This repo has no remote configured yet.

```bash
git remote add origin <your-github-repo-url>
git push -u origin main
```

### 2. Deploy the contact service to Fly.io

```bash
cd contact
fly launch --no-deploy --copy-config --name <your-app-name>
fly secrets set \
  SITE_ORIGIN=https://<your-domain> \
  RESEND_API_KEY=<your-resend-api-key> \
  CONTACT_FROM=<verified-sender@your-domain> \
  CONTACT_TO=<inbox-to-receive-messages>
fly deploy
curl -s https://<your-app-name>.fly.dev/healthz   # expect: ok
```

### 3. Deploy the site to Vercel

- Import this GitHub repo into Vercel.
- Set the project's root directory to `web/`.
- Set env vars:
  - `NEXT_PUBLIC_SITE_URL=https://<your-domain>`
  - `NEXT_PUBLIC_CONTACT_API_URL=https://<your-app-name>.fly.dev/api/contact`
- Add the custom domain and confirm automatic HTTPS.
- Confirm per-PR preview deployments are enabled (Vercel's default for a
  GitHub-imported project).

### 4. Wire the real origins into local config, then redeploy

Two placeholders in this repo must be replaced with real values once the
above exists:

- `web/vercel.json` — the CSP `connect-src` directive has a literal
  placeholder `https://REPLACE_ME.fly.dev`. Replace it with your real
  Fly.io app origin from step 2 (e.g. `https://<your-app-name>.fly.dev`).
- `web/app/layout.tsx` — the Cloudflare Web Analytics beacon has
  `data-cf-beacon='{"token":"REPLACE_ME"}'`. Replace `REPLACE_ME` with the
  real site token from the Cloudflare dashboard (Analytics & Logs → Web
  Analytics → add a site) once analytics is set up. This token is not a
  secret — it's fine to commit.

Commit both changes and redeploy the site on Vercel.

**JSON-LD CSP hash:** the site's `Person` structured-data block
(`<script type="application/ld+json">` in `web/app/layout.tsx`) is allowed by
CSP via a `sha256-...` hash in `web/vercel.json`'s `script-src`, not
`'unsafe-inline'` (see ADR 0002 for why it stays inline rather than moving to
a linked file). **Whenever `web/content/profile.json`'s owner-editable
fields change** (name, degree, links — anything `personJsonLd()` in
`web/lib/metadata.ts` reads), the hash goes stale and must be regenerated:

```bash
cd web
node scripts/generate-csp-hash.mjs   # prints sha256-<hash>
```

Paste the printed value into `web/vercel.json`'s `script-src` directive
(replacing the existing `sha256-...` entry) and redeploy. If this is
forgotten, the JSON-LD script gets blocked by CSP at runtime — check the
browser console for a CSP violation, or Search Console's structured-data
report, if the profile's rich snippet stops updating after a content change.

### 5. Verify security headers on the live site

```bash
curl -sI https://<your-domain> | grep -Ei 'content-security-policy|strict-transport|x-content-type|referrer-policy|permissions-policy'
```

All five headers should be present (they come from `web/vercel.json`).

### 6. Rotating the Resend API key

1. Generate a new API key in the Resend dashboard.
2. `fly secrets set RESEND_API_KEY=<new-key>` (from `contact/`) — this
   restarts the Fly.io machine so the new secret takes effect immediately.
3. Confirm the contact form still works end to end (submit a test message).
4. Revoke the old key in the Resend dashboard.

### 7. Rolling back a Vercel deploy

- Dashboard: open the project's **Deployments** list, find a previous
  known-good deployment, and choose **Promote to Production**.
- CLI: `vercel rollback` from the `web/` project (requires the Vercel CLI
  authenticated to the project).

### Where alerts land

The contact service logs a structured `ALERT contact send_failed` line
(`contact/main.go`) on any email-send failure. Fly.io captures stdout/stderr
as its log stream; a Fly.io log-based alert configured on that `ALERT`
marker is the intended notification path — see ADR 0002. This is not yet
configured against a real Fly.io app (there isn't one yet); configure it in
the Fly.io dashboard for the app created in step 2.
