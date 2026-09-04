# Personal Profile Site (MVP) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Phase 0 + Phase 1 (MVP) personal profile site from the spec: a statically-built Next.js site plus a small Go contact service, deployed on HTTPS with CI quality gates.

**Architecture:** All profile content lives as JSON + Markdown in the repo and is compiled into a fully static site at build time (`next build` with `output: 'export'`) — there is no runtime API for reading content. The only dynamic behaviour is `POST /api/contact`, served by a separate small Go (`net/http`) service that validates, applies anti-spam, and hands the message to a transactional email provider. Frontend and contact service deploy independently.

**Tech Stack:** Next.js 15 (App Router, static export) · React 19 · TypeScript · Tailwind CSS v4 · Go 1.23 (`net/http`) · Resend · Vitest + React Testing Library · Playwright + `@axe-core/playwright` · Lighthouse CI · GitHub Actions · Vercel (site) + Fly.io (contact service) · pnpm · Node 22 LTS.

**Spec:** `profile-site-specifications.md` (Draft v2). The plan argues from the spec; executors read both.

## Global Constraints

Every task's requirements implicitly include this section. Values are copied verbatim from the spec.

- **Audiences:** recruiters and hiring managers only. No engineering-manager persona anywhere. (§2)
- **Scope of this plan:** Phase 0 + Phase 1 (MVP) only. Out of scope: "How I Solve Problems" full case-study pages, Achievements deep content, architecture diagrams for ≥2 projects as a gate, project filtering, dark mode, standalone Go showcase repo, live demos, notes list, motion. (§3.2, §11)
- **Canonical homepage identity copy (US-01) — single source of truth, reused verbatim in `<title>`/meta/Open Graph:**
  - Line 1: `[Full Name]` (owner-supplied once, in `content/profile.json`)
  - Line 2: `BSc (Hons) Computing Science Graduate`
  - Line 3: `Software Engineering · AI/ML · Data · Cloud`
  - Line 4: one–two-sentence intro (owner-supplied once, in `content/profile.json`)
  - No competing variant of the identity line anywhere else on the site.
- **No database. No CMS/admin UI. No auth. English only. No long-term storage of contact submissions.** (§3.3)
- **No runtime API for reading content** — all content compiled at build time. (§6.1)
- **Skills:** grouped, never one flat list. No numeric proficiency bars or percentages anywhere. Cloud services nested under provider, e.g. `AWS (Lambda, S3, Step Functions)` — never top-level. Every group carries one sentence of real-usage context. (§4.2)
- **Performance budgets (fail CI), homepage + project pages:** Lighthouse Performance ≥ 95; LCP < 2.0s (lab, mobile); CLS < 0.1; INP < 200ms; total JS ≤ 150 KB gzipped (homepage); total first-load page weight ≤ 500 KB (homepage). Images AVIF/WebP with explicit `width`/`height`, lazy below the fold. Fonts self-hosted `woff2`, `font-display: swap`, system fallback stack. (§5.1)
- **Accessibility: WCAG 2.1 AA.** Semantic landmarks; exactly one `<h1>` per page; no skipped heading levels; visible focus indicator; "skip to content" link; text contrast ≥ 4.5:1 (≥ 3:1 large text / UI components); meaningful `alt` on images, empty `alt` for decorative; form errors associated via `aria-describedby` and announced; honour `prefers-reduced-motion`; `axe-core` scan passes with zero serious/critical violations. (§5.2)
- **SEO:** unique `<title>` + meta description per page; Open Graph + Twitter Card with a 1200×630 image; canonical URL per page; `sitemap.xml` + `robots.txt`; JSON-LD `Person` on the homepage with `sameAs` links to LinkedIn/GitHub; primary content server-rendered (no client fetch). (§5.3)
- **Browser support:** last 2 major versions of Chrome, Firefox, Edge, Safari (desktop); iOS Safari + Chrome for Android (last 2); minimum viewport 320px; no IE. Core content (text, links, CV download) usable with JavaScript disabled. The contact form is the only feature allowed to require JS, and it still shows the `mailto:` fallback without it. (§5.4)
- **Security:** HTTPS + HSTS; `Content-Security-Policy` (no inline script except hash/nonce); `X-Content-Type-Options: nosniff`; `Referrer-Policy: strict-origin-when-cross-origin`; locked `Permissions-Policy`. Contact API: `name` ≤ 100, `email` ≤ 200, `message` ≤ 5000 characters; server-side email-format validation; honeypot + fill-time check; IP rate limiting 5 requests / minute / IP; never reflect submitted content into an HTML response; CORS restricted to the site's own origin; secrets via env vars, `.env.example` documents names only; `npm audit` + `govulncheck` in CI; Dependabot enabled. (§5.5)
- **Privacy:** cookieless / privacy-respecting analytics only, no consent banner; contact submissions emailed and not persisted by the app; `/privacy` page states this; one-line privacy note next to the form. (§4.7, §5.6)
- **Touch/layout:** tap targets ≥ 44×44px; no horizontal scrolling at 320px; logical content order when linearised. (§4.8)
- **Contact endpoint contract (§6.4):**
  `POST /api/contact` — request `{ name, email, message, website (honeypot, must be empty) }` (plus `renderedAt` epoch-ms for the fill-time check)
  - `200 { ok: true }`
  - `400 { ok: false, error: "validation", fields: { <field>: <reason> } }`
  - `429 { ok: false, error: "rate_limited" }`
  - `502 { ok: false, error: "send_failed" }` — also triggers a server-side alert
- **Case-study quality bar (build-enforced where possible):** 400–800 words body; every technology entry states *why* it was chosen; each key decision names the rejected alternative; at least one project states a measurable result; content drawn from real project/coursework. (§4.4, §7.1)
- **Repo:** one public GitHub repo containing source, README (setup + testing + architecture notes), a short ADR log, the CV PDF, and a `LICENSE` (MIT for code; case-study prose and images reserved, stated in the README). (§6.6)
- **Deployment:** frontend served static from a CDN host; contact service deployed **separately** as one process per container; never one container running both. (§10)

### Decisions locked for this plan

The spec (§12.2) leaves these open; they are fixed here so the plan is executable. Swappable later without touching feature code.

| Decision | Choice | Note |
|---|---|---|
| Static host | **Vercel** | GitHub integration, per-PR preview deploys, custom domain + automatic HTTPS. `output: 'export'` keeps the build honestly static. |
| Contact service host | **Fly.io** | Persistent small machine → in-memory rate limiting is reliable; Docker-native. |
| Email provider | **Resend** | Free tier; domain verification gives SPF/DKIM. Wrapped behind a `Mailer` interface. |
| Analytics | **Cloudflare Web Analytics** | Free, cookieless, async non-blocking beacon — no consent banner. |
| Markdown | **`markdown-it`** rendered at build time, `html: false` | Content is author-only/trusted; rendered via `dangerouslySetInnerHTML` on `markdown-it` output. |
| Schema validation | **`zod`** | Build fails on invalid content. |
| Domain | chosen once in Phase 0 | Referenced **only** via `NEXT_PUBLIC_SITE_URL` (frontend) and `SITE_ORIGIN` (Go CORS). No literal domain string in code. |

### Repository layout (target)

```text
personal-profile-site/
├── .github/workflows/ci.yml
├── .github/dependabot.yml
├── web/                          # Next.js static site
│   ├── app/
│   │   ├── layout.tsx            # metadata, OG, JSON-LD, fonts, skip link
│   │   ├── page.tsx              # homepage — all sections
│   │   ├── projects/[slug]/page.tsx
│   │   ├── cv/page.tsx
│   │   ├── privacy/page.tsx
│   │   ├── not-found.tsx
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   └── globals.css
│   ├── components/
│   │   ├── SkipLink.tsx  Navbar.tsx  Footer.tsx  Section.tsx
│   │   ├── Hero.tsx  LookingFor.tsx  SkillGroup.tsx  SkillsSection.tsx
│   │   ├── ProjectCard.tsx  ProjectsSection.tsx  ProblemSolvingTeasers.tsx
│   │   ├── Timeline.tsx  AchievementsSection.tsx  CaseStudy.tsx
│   │   ├── CvSection.tsx  ContactSection.tsx  ContactForm.tsx
│   ├── lib/
│   │   ├── schemas.ts            # zod schemas + inferred types
│   │   ├── content.ts            # load + validate JSON/Markdown (build time)
│   │   ├── markdown.ts           # markdown-it render
│   │   └── siteConfig.ts         # env plumbing + fixed identity constants
│   ├── content/
│   │   ├── profile.json  skills.json  achievements.json
│   │   └── projects/<slug>.md
│   ├── public/                   # og.png, cv.pdf, favicons, project images
│   ├── tests/                    # Vitest unit tests
│   ├── e2e/                      # Playwright specs
│   ├── next.config.mjs  vercel.json  tailwind.config.ts
│   ├── vitest.config.ts  playwright.config.ts  lighthouserc.json
│   ├── eslint.config.mjs  tsconfig.json  package.json
├── contact/                      # Go contact service
│   ├── main.go  handler.go  validate.go  ratelimit.go
│   ├── mailer.go  mailer_resend.go
│   ├── handler_test.go  validate_test.go  ratelimit_test.go
│   ├── Dockerfile  fly.toml  .env.example  go.mod
├── docs/
│   ├── superpowers/plans/2026-09-04-profile-site-mvp.md
│   ├── adr/0001-static-build-no-read-api.md
│   └── style.md
├── README.md  LICENSE  .gitignore
```

---

## Phase 0 — Foundations

### Task 1: Repository skeleton & licensing

**Files:**
- Create: `.gitignore`, `LICENSE`, `README.md`, `docs/adr/0001-static-build-no-read-api.md`, `docs/style.md`, `.github/dependabot.yml`

**Interfaces:**
- Produces: an initialised git repo on branch `main`; top-level `web/` and `contact/` directories exist (empty placeholders `.gitkeep`).

- [ ] **Step 1: Initialise the repo**

```bash
cd /Users/kai.wen.chang/projects/personal-profile-site
git init -b main
mkdir -p web contact docs/adr && touch web/.gitkeep contact/.gitkeep
```

- [ ] **Step 2: Write `.gitignore`**

```gitignore
# Node
node_modules/
web/.next/
web/out/
web/coverage/
web/playwright-report/
web/test-results/
web/.vercel/

# Go
contact/contact
contact/*.test

# Env / OS
.env
.env.*
!.env.example
.DS_Store
```

- [ ] **Step 3: Write `LICENSE` (MIT) and record the content-reservation in `README.md`**

Use the standard MIT text with the current year and `[Full Name]` as the copyright holder. Add to `README.md`:

```markdown
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
```

- [ ] **Step 4: Write ADR `docs/adr/0001-static-build-no-read-api.md`**

```markdown
# 0001 — Static build, no runtime content API

**Status:** accepted
**Context:** Profile content is small and changes rarely. Spec §6.1.
**Decision:** Compile all content (JSON + Markdown in the repo) into a static
Next.js export at build time. The only server is the Go contact endpoint.
**Consequences:** Fastest possible delivery, trivial hosting, strong SEO. Content
changes require a rebuild (acceptable — "edit a file, open a PR"). Go is showcased
by the contact service and, later, a separate standalone repo.
```

- [ ] **Step 5: Write `docs/style.md` (visual style note — spec §6.3) and `.github/dependabot.yml`**

`docs/style.md` records: type scale (1.200 minor-third, base 16px → 16/19/23/28/33/40), spacing scale (4/8/12/16/24/32/48/64), colour tokens (`--bg`, `--fg`, `--muted`, `--accent`, `--border`) with hex values whose text/background pairs meet 4.5:1, and a system font fallback stack. `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: npm
    directory: /web
    schedule: { interval: weekly }
  - package-ecosystem: gomod
    directory: /contact
    schedule: { interval: weekly }
  - package-ecosystem: github-actions
    directory: /
    schedule: { interval: weekly }
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: repo skeleton, licence, ADR, style note"
```

---

### Task 2: Next.js + Tailwind scaffold & design tokens

**Files:**
- Create: `web/package.json`, `web/tsconfig.json`, `web/next.config.mjs`, `web/eslint.config.mjs`, `web/tailwind.config.ts`, `web/postcss.config.mjs`, `web/app/layout.tsx`, `web/app/page.tsx`, `web/app/globals.css`, `web/components/SkipLink.tsx`
- Test: `web/tests/smoke.test.tsx`

**Interfaces:**
- Produces: `pnpm dev` serves a page at `/`; `pnpm build` produces a static export in `web/out/`; Tailwind tokens from `docs/style.md` available as CSS variables + Tailwind theme.

- [ ] **Step 1: Scaffold the app non-interactively**

```bash
cd web
pnpm dlx create-next-app@latest . --ts --app --tailwind --eslint --src-dir=false --import-alias "@/*" --no-turbopack --use-pnpm --yes
```

- [ ] **Step 2: Set `web/next.config.mjs` for static export**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: false },
  typescript: { ignoreBuildErrors: false },
};
export default nextConfig;
```

- [ ] **Step 3: Put design tokens in `web/app/globals.css`**

Replace the Tailwind starter file with the `@import "tailwindcss";` line plus a `:root` block defining `--bg`, `--fg`, `--muted`, `--accent`, `--border`, the type-scale custom properties, and a `@media (prefers-reduced-motion: reduce)` block that disables transitions/animations. Set `body { background: var(--bg); color: var(--fg); }` and a self-hostable system font stack (`ui-sans-serif, system-ui, ...`). Map the tokens into Tailwind via `@theme` (Tailwind v4).

- [ ] **Step 4: Write `web/components/SkipLink.tsx`**

```tsx
export function SkipLink() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-[var(--fg)] focus:px-4 focus:py-2 focus:text-[var(--bg)]"
    >
      Skip to content
    </a>
  );
}
```

- [ ] **Step 5: Minimal `web/app/layout.tsx` and `web/app/page.tsx`**

`layout.tsx` renders `<html lang="en">`, `<body>`, `<SkipLink />`, and `{children}` wrapped so pages can supply `<main id="main">`. `page.tsx` returns `<main id="main"><h1>Profile site</h1></main>` as a placeholder (replaced in Task 11).

- [ ] **Step 6: Write the smoke test `web/tests/smoke.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import Page from "@/app/page";

test("homepage renders an h1", () => {
  render(<Page />);
  expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
});
```

(This test will run once Task 3 wires Vitest; leave it committed now.)

- [ ] **Step 7: Verify build works**

Run: `cd web && pnpm build`
Expected: completes; `web/out/index.html` exists and contains `Profile site`.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(web): next.js static-export scaffold + design tokens"
```

---

### Task 3: Frontend tooling (Vitest, Playwright, ESLint, Lighthouse CI, scripts)

**Files:**
- Create: `web/vitest.config.ts`, `web/tests/setup.ts`, `web/playwright.config.ts`, `web/lighthouserc.json`
- Modify: `web/package.json` (scripts + devDeps), `web/eslint.config.mjs`

**Interfaces:**
- Produces: scripts `pnpm test`, `pnpm test:watch`, `pnpm test:e2e`, `pnpm lhci`, `pnpm lint`, `pnpm typecheck`, `pnpm build`. CI (Task 5) calls only these names; later tasks add test files that these globs pick up automatically.

- [ ] **Step 1: Add dev dependencies**

```bash
cd web
pnpm add -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test @axe-core/playwright @lhci/cli
pnpm exec playwright install --with-deps chromium
```

- [ ] **Step 2: `web/vitest.config.ts` + `web/tests/setup.ts`**

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}", "lib/**/*.test.ts"],
    coverage: { provider: "v8", include: ["lib/**", "components/**"] },
  },
});
```

```ts
// tests/setup.ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 3: `web/playwright.config.ts`**

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  webServer: {
    command: "pnpm build && pnpm exec serve out -l 4321",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: "http://localhost:4321" },
});
```

Add `serve` as a dev dep: `pnpm add -D serve`.

- [ ] **Step 4: `web/lighterhouserc.json` → `web/lighthouserc.json`**

```json
{
  "ci": {
    "collect": {
      "staticDistDir": "./out",
      "url": ["http://localhost/index.html", "http://localhost/projects/_SAMPLE_/index.html"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.95 }],
        "categories:accessibility": ["error", { "minScore": 1 }],
        "categories:seo": ["error", { "minScore": 1 }],
        "categories:best-practices": ["error", { "minScore": 1 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2000 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-byte-weight": ["error", { "maxNumericValue": 512000 }]
      }
    }
  }
}
```

The `_SAMPLE_` URL is replaced with a real project slug in Task 15.

- [ ] **Step 5: `web/package.json` scripts**

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "lhci": "lhci autorun"
  }
}
```

- [ ] **Step 6: Run the tooling to confirm it's wired**

Run: `cd web && pnpm typecheck && pnpm test`
Expected: `pnpm test` passes the Task 2 smoke test.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore(web): vitest, playwright, axe, lighthouse-ci tooling"
```

---

### Task 4: Go contact-service scaffold

**Files:**
- Create: `contact/go.mod`, `contact/main.go`, `contact/.env.example`, `contact/Dockerfile`, `contact/fly.toml`, `contact/health_test.go`

**Interfaces:**
- Produces: `go run .` in `contact/` starts an HTTP server on `:8080` with `GET /healthz` → `200 "ok"`. `envOr(key, default)` and `mustEnv(key)` helpers.

- [ ] **Step 1: Init the module**

```bash
cd contact
go mod init github.com/OWNER/personal-profile-site/contact
go mod edit -go=1.23
```

- [ ] **Step 2: Write the failing health test `contact/health_test.go`**

```go
package main

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHealthz(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/healthz", nil)
	rec := httptest.NewRecorder()
	newMux().ServeHTTP(rec, req)
	if rec.Code != http.StatusOK || rec.Body.String() != "ok" {
		t.Fatalf("got %d %q", rec.Code, rec.Body.String())
	}
}
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `cd contact && go test ./...`
Expected: FAIL — `newMux` undefined.

- [ ] **Step 4: Write `contact/main.go` (minimal)**

```go
package main

import (
	"context"
	"errors"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"time"
)

func envOr(k, def string) string {
	if v := os.Getenv(k); v != "" {
		return v
	}
	return def
}

func mustEnv(k string) string {
	v := os.Getenv(k)
	if v == "" {
		panic("missing required env var: " + k)
	}
	return v
}

func newMux() *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		_, _ = w.Write([]byte("ok"))
	})
	return mux
}

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	srv := &http.Server{
		Addr:         ":" + envOr("PORT", "8080"),
		Handler:      newMux(),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
	}
	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server error", "err", err)
			os.Exit(1)
		}
	}()
	logger.Info("listening", "addr", srv.Addr)

	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	<-ctx.Done()
	sctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(sctx)
}
```

- [ ] **Step 5: Run the test to confirm it passes**

Run: `cd contact && go test ./...`
Expected: PASS.

- [ ] **Step 6: Write `contact/.env.example`, `contact/Dockerfile`, `contact/fly.toml`**

```dotenv
# contact/.env.example — names only, no values
PORT=8080
SITE_ORIGIN=
RESEND_API_KEY=
CONTACT_FROM=
CONTACT_TO=
```

```dockerfile
# contact/Dockerfile
FROM golang:1.23-alpine AS build
WORKDIR /src
COPY go.mod ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -o /out/contact .

FROM gcr.io/distroless/static-debian12
COPY --from=build /out/contact /contact
EXPOSE 8080
USER nonroot:nonroot
ENTRYPOINT ["/contact"]
```

```toml
# contact/fly.toml
app = "profile-contact"
primary_region = "lhr"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false
  min_machines_running = 1

[[http_service.checks]]
  path = "/healthz"
  interval = "15s"
  timeout = "2s"
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(contact): go service scaffold with /healthz, Dockerfile, fly.toml"
```

---

### Task 5: CI pipeline (GitHub Actions)

**Files:**
- Create: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `web` scripts from Task 3 (`lint`, `typecheck`, `test`, `build`, `test:e2e`, `lhci`); `contact` Go module from Task 4.
- Produces: a required status check that must be green to merge; runs on every PR and on push to `main`.

- [ ] **Step 1: Write `.github/workflows/ci.yml`**

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  web:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: web } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm, cache-dependency-path: web/pnpm-lock.yaml }
      - run: pnpm install --frozen-lockfile
      - run: pnpm audit --audit-level=high
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
      - run: pnpm lhci

  contact:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: contact } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: "1.23", cache-dependency-path: contact/go.sum }
      - run: go vet ./...
      - run: go install golang.org/x/vuln/cmd/govulncheck@latest && govulncheck ./...
      - run: go test -race -coverprofile=cover.out ./...
      - run: go tool cover -func=cover.out | tail -1
```

- [ ] **Step 2: Push a branch and open a PR to confirm CI runs green**

```bash
git checkout -b ci/bootstrap
git add -A && git commit -m "ci: lint, typecheck, unit, build, e2e, lighthouse, govulncheck"
git push -u origin ci/bootstrap
gh pr create --fill
```

Expected: both `web` and `contact` jobs pass. Merge the PR.

---

## Phase 1 — Content layer & app shell

### Task 6: Content schemas + JSON loader (zod, build-fail on invalid)

**Files:**
- Create: `web/lib/schemas.ts`, `web/lib/content.ts`, `web/content/profile.json`, `web/content/skills.json`, `web/content/achievements.json`
- Test: `web/lib/content.test.ts`, `web/tests/fixtures/content-bad/` (fixture files)

**Interfaces:**
- Produces:
  - `getProfile(dir?: string): Profile` — throws on invalid JSON, listing zod errors.
  - `getSkills(dir?: string): { groups: SkillGroup[] }` — throws on invalid.
  - `getAchievements(dir?: string): { items: Achievement[] }` — throws on invalid.
  - Types `Profile`, `SkillGroup`, `Achievement` exported from `schemas.ts`.
  - `Profile` shape: `{ fullName: string; degree: "BSc (Hons) Computing Science Graduate"; identityLine: "Software Engineering · AI/ML · Data · Cloud"; intro: string; lookingFor: { roleTypes: string[]; domains: string[]; location: string }; links: { email: string; linkedin: string; github: string } }`

- [ ] **Step 1: Write `web/lib/schemas.ts`**

```ts
import { z } from "zod";

export const profileSchema = z.object({
  fullName: z.string().min(1),
  degree: z.literal("BSc (Hons) Computing Science Graduate"),
  identityLine: z.literal("Software Engineering · AI/ML · Data · Cloud"),
  intro: z.string().min(20).max(320),
  lookingFor: z.object({
    roleTypes: z.array(z.string().min(1)).min(1),
    domains: z.array(z.string().min(1)).min(1),
    location: z.string().min(1),
  }),
  links: z.object({
    email: z.string().email(),
    linkedin: z.string().url(),
    github: z.string().url(),
  }),
});
export type Profile = z.infer<typeof profileSchema>;

export const skillGroupSchema = z.object({
  name: z.string().min(1),
  context: z.string().min(1), // US-04: one sentence of real usage
  skills: z.array(z.string().min(1)).min(1),
});
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export const skillsSchema = z.object({ groups: z.array(skillGroupSchema).min(1) });

export const achievementSchema = z.object({
  date: z.string().regex(/^\d{4}(-\d{2})?$/), // YYYY or YYYY-MM
  title: z.string().min(1),
  detail: z.string().min(1),
  evidenceUrl: z.string().url().optional(),
});
export type Achievement = z.infer<typeof achievementSchema>;
export const achievementsSchema = z.object({ items: z.array(achievementSchema).min(1) });
```

- [ ] **Step 2: Write the failing test `web/lib/content.test.ts`**

```ts
import { describe, expect, test } from "vitest";
import path from "node:path";
import { getProfile, getSkills, getAchievements } from "@/lib/content";

const GOOD = path.resolve(__dirname, "../content");
const BAD = path.resolve(__dirname, "../tests/fixtures/content-bad");

describe("content loader", () => {
  test("loads valid profile.json", () => {
    const p = getProfile(GOOD);
    expect(p.degree).toBe("BSc (Hons) Computing Science Graduate");
    expect(p.identityLine).toBe("Software Engineering · AI/ML · Data · Cloud");
  });

  test("throws with a helpful message on invalid profile.json", () => {
    expect(() => getProfile(BAD)).toThrow(/profile\.json/i);
  });

  test("skills groups are non-empty and carry context", () => {
    for (const g of getSkills(GOOD).groups) {
      expect(g.skills.length).toBeGreaterThan(0);
      expect(g.context.length).toBeGreaterThan(0);
    }
  });

  test("achievements load newest-first friendly", () => {
    expect(getAchievements(GOOD).items.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run it to confirm it fails**

Run: `cd web && pnpm test lib/content.test.ts`
Expected: FAIL — `getProfile` not exported.

- [ ] **Step 4: Write `web/lib/content.ts`**

```ts
import fs from "node:fs";
import path from "node:path";
import {
  profileSchema,
  skillsSchema,
  achievementsSchema,
  type Profile,
  type SkillGroup,
  type Achievement,
} from "./schemas";

const DEFAULT_DIR = path.join(process.cwd(), "content");

function readJson(dir: string, file: string): unknown {
  return JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
}

export function getProfile(dir: string = DEFAULT_DIR): Profile {
  const parsed = profileSchema.safeParse(readJson(dir, "profile.json"));
  if (!parsed.success) {
    throw new Error(`Invalid content/profile.json:\n${parsed.error.toString()}`);
  }
  return parsed.data;
}

export function getSkills(dir: string = DEFAULT_DIR): { groups: SkillGroup[] } {
  const parsed = skillsSchema.safeParse(readJson(dir, "skills.json"));
  if (!parsed.success) {
    throw new Error(`Invalid content/skills.json:\n${parsed.error.toString()}`);
  }
  return parsed.data;
}

export function getAchievements(dir: string = DEFAULT_DIR): { items: Achievement[] } {
  const parsed = achievementsSchema.safeParse(readJson(dir, "achievements.json"));
  if (!parsed.success) {
    throw new Error(`Invalid content/achievements.json:\n${parsed.error.toString()}`);
  }
  parsed.data.items.sort((a, b) => (a.date < b.date ? 1 : -1)); // newest first
  return parsed.data;
}
```

- [ ] **Step 5: Author real `web/content/*.json`**

`profile.json` — owner fills `fullName` and `intro`; `degree` and `identityLine` are the fixed strings from Global Constraints; `lookingFor` and `links` filled with real values.
`skills.json` — the four groups from spec §4.2 verbatim (`Languages`; `AI / Machine Learning`; `Cloud & Infrastructure` with `"AWS (Lambda, S3, Step Functions)"` and `"Docker"` as the two entries; `Web & Tooling`), each with a one-sentence `context`.
`achievements.json` — real items (degree, internship, etc.), each with `date`, `title`, `detail`, optional `evidenceUrl`.

- [ ] **Step 6: Create the bad fixture `web/tests/fixtures/content-bad/profile.json`**

A JSON object missing `links` and with `degree: "wrong"` — enough to fail the schema. Also copy valid `skills.json`/`achievements.json` there so only the profile test exercises the failure path.

- [ ] **Step 7: Run tests to confirm pass**

Run: `cd web && pnpm test lib/content.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(web): zod content schemas + build-time JSON loader"
```

---

### Task 7: Markdown case-study loader

**Files:**
- Modify: `web/lib/schemas.ts` (add `projectFrontmatterSchema`)
- Create: `web/lib/markdown.ts`
- Modify: `web/lib/content.ts` (add `getProjects`, `getProject`)
- Create: `web/content/projects/<slug>.md` × 3 (real case studies)
- Test: `web/lib/projects.test.ts`, `web/tests/fixtures/projects-bad/short.md`

**Interfaces:**
- Consumes: `renderMarkdown` from `markdown.ts`.
- Produces:
  - `renderMarkdown(src: string): string` — HTML from `markdown-it` (`html: false`).
  - `getProjects(dir?: string): Project[]` — sorted by `frontmatter.order` asc; **throws** if any file's slug ≠ filename, body word count is outside 400–800, or there are fewer than 3 files.
  - `getProject(slug: string, dir?: string): Project | undefined`
  - `Project` = `{ frontmatter: ProjectFrontmatter; bodyHtml: string; wordCount: number }`
  - `ProjectFrontmatter` = `{ title: string; slug: string; summary: string; problem: string; solution: string; technologies: { name: string; why: string }[]; contribution: string; decisions: { decision: string; rejectedAlternative: string }[]; result: string; learned: string; githubUrl?: string; demoUrl?: string; architectureImage?: string; architectureImageAlt?: string; order: number }`

- [ ] **Step 1: Add deps**

```bash
cd web && pnpm add markdown-it gray-matter && pnpm add -D @types/markdown-it
```

- [ ] **Step 2: Extend `web/lib/schemas.ts`**

```ts
export const projectFrontmatterSchema = z
  .object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    summary: z.string().min(1).max(300),
    problem: z.string().min(1),
    solution: z.string().min(1),
    technologies: z
      .array(z.object({ name: z.string().min(1), why: z.string().min(1) }))
      .min(1),
    contribution: z.string().min(1),
    decisions: z
      .array(z.object({ decision: z.string().min(1), rejectedAlternative: z.string().min(1) }))
      .min(1),
    result: z.string().min(1),
    learned: z.string().min(1),
    githubUrl: z.string().url().optional(),
    demoUrl: z.string().url().optional(),
    architectureImage: z.string().optional(),
    architectureImageAlt: z.string().optional(),
    order: z.number().int(),
  })
  .refine((d) => !d.architectureImage || !!d.architectureImageAlt, {
    message: "architectureImageAlt is required when architectureImage is set",
  });
export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>;
```

- [ ] **Step 3: Write `web/lib/markdown.ts`**

```ts
import MarkdownIt from "markdown-it";

const md = new MarkdownIt({ html: false, linkify: true, typographer: true });

export function renderMarkdown(src: string): string {
  return md.render(src);
}
```

- [ ] **Step 4: Write the failing test `web/lib/projects.test.ts`**

```ts
import { describe, expect, test } from "vitest";
import path from "node:path";
import { getProjects, getProject } from "@/lib/content";

const GOOD = path.resolve(__dirname, "../content");

describe("project loader", () => {
  test("loads >= 3 projects sorted by order", () => {
    const p = getProjects(GOOD);
    expect(p.length).toBeGreaterThanOrEqual(3);
    const orders = p.map((x) => x.frontmatter.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  test("every technology entry has a reason", () => {
    for (const proj of getProjects(GOOD)) {
      for (const t of proj.frontmatter.technologies) {
        expect(t.why.trim().length).toBeGreaterThan(0);
      }
    }
  });

  test("every project body is 400–800 words", () => {
    for (const proj of getProjects(GOOD)) {
      expect(proj.wordCount).toBeGreaterThanOrEqual(400);
      expect(proj.wordCount).toBeLessThanOrEqual(800);
    }
  });

  test("at least one project states a measurable result (contains a digit)", () => {
    expect(getProjects(GOOD).some((p) => /\d/.test(p.frontmatter.result))).toBe(true);
  });

  test("getProject returns by slug", () => {
    const first = getProjects(GOOD)[0];
    expect(getProject(first.frontmatter.slug, GOOD)?.frontmatter.title).toBe(first.frontmatter.title);
  });
});
```

- [ ] **Step 5: Run to confirm it fails**

Run: `cd web && pnpm test lib/projects.test.ts`
Expected: FAIL — `getProjects` not exported.

- [ ] **Step 6: Add loader functions to `web/lib/content.ts`**

```ts
import matter from "gray-matter";
import { projectFrontmatterSchema, type ProjectFrontmatter } from "./schemas";
import { renderMarkdown } from "./markdown";

export interface Project {
  frontmatter: ProjectFrontmatter;
  bodyHtml: string;
  wordCount: number;
}

function countWords(s: string): number {
  const t = s.trim();
  return t ? t.split(/\s+/).length : 0;
}

export function getProjects(dir: string = DEFAULT_DIR): Project[] {
  const projectsDir = path.join(dir, "projects");
  const files = fs.readdirSync(projectsDir).filter((f) => f.endsWith(".md"));
  const projects = files.map((f) => {
    const { data, content } = matter(fs.readFileSync(path.join(projectsDir, f), "utf8"));
    const parsed = projectFrontmatterSchema.safeParse(data);
    if (!parsed.success) {
      throw new Error(`Invalid frontmatter in projects/${f}:\n${parsed.error.toString()}`);
    }
    const base = f.replace(/\.md$/, "");
    if (parsed.data.slug !== base) {
      throw new Error(`projects/${f}: slug "${parsed.data.slug}" must equal filename "${base}"`);
    }
    const words = countWords(content);
    if (words < 400 || words > 800) {
      throw new Error(`projects/${f}: body is ${words} words; spec §7.1 requires 400–800`);
    }
    return { frontmatter: parsed.data, bodyHtml: renderMarkdown(content), wordCount: words };
  });
  if (projects.length < 3) {
    throw new Error(`spec §3.1 requires ≥3 projects at launch; found ${projects.length}`);
  }
  return projects.sort((a, b) => a.frontmatter.order - b.frontmatter.order);
}

export function getProject(slug: string, dir: string = DEFAULT_DIR): Project | undefined {
  return getProjects(dir).find((p) => p.frontmatter.slug === slug);
}
```

- [ ] **Step 7: Author 3 real case studies in `web/content/projects/`**

Each `.md`: YAML front-matter matching the schema (filename = slug), then a 400–800-word body structured `## Problem / ## Approach / ## Technical decisions / ## Implementation / ## Testing / ## Results / ## What I learned`. Must clear the quality bar in Global Constraints. At least one `result` contains a number. At least 2 set `architectureImage` + `architectureImageAlt` (images added in Task 17).

- [ ] **Step 8: Run tests to confirm pass**

Run: `cd web && pnpm test lib/projects.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat(web): markdown case-study loader with spec-rule enforcement"
```

---

### Task 8: siteConfig + fixed identity constants

**Files:**
- Create: `web/lib/siteConfig.ts`, `web/lib/siteConfig.test.ts`, `web/.env.example`

**Interfaces:**
- Produces:
  - `SITE_URL: string` — from `NEXT_PUBLIC_SITE_URL`, default `http://localhost:3000`.
  - `CONTACT_API_URL: string` — from `NEXT_PUBLIC_CONTACT_API_URL`, default `http://localhost:8080/api/contact`.
  - `DEGREE = "BSc (Hons) Computing Science Graduate"` and `IDENTITY_LINE = "Software Engineering · AI/ML · Data · Cloud"` (frozen constants; guarded by a test).

- [ ] **Step 1: Write the failing test `web/lib/siteConfig.test.ts`**

```ts
import { expect, test } from "vitest";
import { DEGREE, IDENTITY_LINE } from "@/lib/siteConfig";

test("identity constants match the spec verbatim", () => {
  expect(DEGREE).toBe("BSc (Hons) Computing Science Graduate");
  expect(IDENTITY_LINE).toBe("Software Engineering · AI/ML · Data · Cloud");
});
```

- [ ] **Step 2: Run to confirm it fails, then write `web/lib/siteConfig.ts`**

```ts
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
export const CONTACT_API_URL =
  process.env.NEXT_PUBLIC_CONTACT_API_URL ?? "http://localhost:8080/api/contact";

// Fixed by spec §4.1 — do not vary anywhere else on the site.
export const DEGREE = "BSc (Hons) Computing Science Graduate";
export const IDENTITY_LINE = "Software Engineering · AI/ML · Data · Cloud";
```

- [ ] **Step 3: Write `web/.env.example`**

```dotenv
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_CONTACT_API_URL=
```

- [ ] **Step 4: Run test to confirm pass, then commit**

```bash
cd web && pnpm test lib/siteConfig.test.ts
git add -A && git commit -m "feat(web): siteConfig env plumbing + frozen identity constants"
```

---

### Task 9: Root layout — metadata, Open Graph, JSON-LD Person, fonts

**Files:**
- Modify: `web/app/layout.tsx`
- Create: `web/lib/metadata.ts`, `web/lib/metadata.test.ts`, `web/app/fonts.ts`

**Interfaces:**
- Consumes: `getProfile()`, `SITE_URL`, `DEGREE`, `IDENTITY_LINE`.
- Produces:
  - `buildRootMetadata(): Metadata` — Next `Metadata` object with `metadataBase`, `title.default`, `title.template`, `description` (= profile intro), `alternates.canonical`, `openGraph` (type `website`, `images` = `/og.png` 1200×630), `twitter` `summary_large_image`.
  - `personJsonLd(): object` — schema.org `Person` with `name`, `jobTitle` = `DEGREE`, `url`, `sameAs` = `[linkedin, github]`.

- [ ] **Step 1: Write the failing test `web/lib/metadata.test.ts`**

```ts
import { expect, test } from "vitest";
import { buildRootMetadata, personJsonLd } from "@/lib/metadata";

test("root metadata carries a canonical and OG image", () => {
  const m = buildRootMetadata();
  expect(m.alternates?.canonical).toBeTruthy();
  expect(JSON.stringify(m.openGraph?.images)).toContain("/og.png");
});

test("Person JSON-LD has sameAs links and jobTitle = degree", () => {
  const ld = personJsonLd() as Record<string, unknown>;
  expect(ld["@type"]).toBe("Person");
  expect(ld.jobTitle).toBe("BSc (Hons) Computing Science Graduate");
  expect((ld.sameAs as string[]).length).toBe(2);
});
```

- [ ] **Step 2: Run to confirm fail, then write `web/lib/metadata.ts`**

```ts
import type { Metadata } from "next";
import { getProfile } from "./content";
import { SITE_URL, DEGREE, IDENTITY_LINE } from "./siteConfig";

export function buildRootMetadata(): Metadata {
  const p = getProfile();
  const title = `${p.fullName} — ${DEGREE}`;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: title, template: `%s — ${p.fullName}` },
    description: p.intro,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      url: SITE_URL,
      title,
      description: `${IDENTITY_LINE}. ${p.intro}`,
      images: [{ url: "/og.png", width: 1200, height: 630, alt: `${p.fullName} — ${IDENTITY_LINE}` }],
    },
    twitter: { card: "summary_large_image", title, description: p.intro, images: ["/og.png"] },
  };
}

export function personJsonLd() {
  const p = getProfile();
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: p.fullName,
    jobTitle: DEGREE,
    url: SITE_URL,
    sameAs: [p.links.linkedin, p.links.github],
  };
}
```

- [ ] **Step 3: Wire `web/app/layout.tsx`**

- `export const metadata = buildRootMetadata();`
- Self-host a variable font via `next/font/local` in `web/app/fonts.ts` (`display: "swap"`), applied to `<html>`.
- `<html lang="en">`, `<body>`: `<SkipLink />`, `<Navbar />` (Task 10), `{children}`, `<Footer />` (Task 10).
- Inject `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd()) }} />` in `<head>` via the `metadata`-adjacent `<Head>`-less App Router pattern (render it inside `layout.tsx` body — Next hoists it).

- [ ] **Step 4: Run tests + build**

Run: `cd web && pnpm test lib/metadata.test.ts && pnpm build`
Expected: tests PASS; `web/out/index.html` contains `application/ld+json` and `og:image`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): root metadata, OG tags, Person JSON-LD, self-hosted font"
```

---

### Task 10: Navbar + Footer + Section wrapper

**Files:**
- Create: `web/components/Navbar.tsx`, `web/components/Footer.tsx`, `web/components/Section.tsx`
- Test: `web/tests/nav.test.tsx`

**Interfaces:**
- Consumes: `getProfile()` (footer links).
- Produces:
  - `<Navbar />` — sticky `<nav aria-label="Primary">` with anchor links to `#summary #skills #projects #problem-solving #achievements #cv #contact`; all focusable; current-section not required for MVP.
  - `<Footer />` — `<footer>` with "Download CV (PDF)" link to `/cv.pdf`, and email/LinkedIn/GitHub links (plain `<a>`, work without JS).
  - `<Section id title children />` — renders `<section aria-labelledby>` + `<h2 id>` so heading order stays correct.

- [ ] **Step 1: Write the failing test `web/tests/nav.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

test("navbar exposes all section anchors", () => {
  render(<Navbar />);
  for (const id of ["#skills", "#projects", "#problem-solving", "#achievements", "#cv", "#contact"]) {
    expect(screen.getByRole("link", { name: new RegExp(id.slice(1), "i") })).toHaveAttribute("href", id);
  }
});

test("footer has a CV download and 3 contact links that need no JS", () => {
  render(<Footer />);
  expect(screen.getByRole("link", { name: /download cv/i })).toHaveAttribute("href", "/cv.pdf");
  expect(screen.getByRole("link", { name: /linkedin/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /github/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to confirm fail; implement the three components**

`Section.tsx`:

```tsx
export function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="mx-auto max-w-3xl px-4 py-16">
      <h2 id={`${id}-h`} className="text-2xl font-semibold">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}
```

`Navbar.tsx` — sticky top, horizontally scrollable on mobile, `min-h-11` links (≥44px). `Footer.tsx` — reads `getProfile().links`, renders `<a href={`mailto:${email}`}>`, LinkedIn, GitHub, and `<a href="/cv.pdf" download>Download CV (PDF)</a>`.

- [ ] **Step 3: Run tests to confirm pass**

Run: `cd web && pnpm test tests/nav.test.tsx`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(web): Navbar, Footer, Section wrapper"
```

---

## Phase 1 — Homepage sections

### Task 11: Homepage skim layer — Hero (#summary, US-01) + Looking-For (#looking-for, US-02)

**Files:**
- Create: `web/components/Hero.tsx`, `web/components/LookingFor.tsx`
- Modify: `web/app/page.tsx`
- Test: `web/tests/hero.test.tsx`

**Interfaces:**
- Consumes: `getProfile()`, `DEGREE`, `IDENTITY_LINE`.
- Produces: `<Hero profile />` renders the single `<h1>` (the full name), then `DEGREE`, `IDENTITY_LINE`, and the intro, in that DOM order. `<LookingFor lookingFor />` renders role types, domains, and location.

- [ ] **Step 1: Write the failing test `web/tests/hero.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { Hero } from "@/components/Hero";
import { getProfile } from "@/lib/content";

test("hero shows the one h1 and the fixed identity lines", () => {
  const p = getProfile();
  render(<Hero profile={p} />);
  const h1 = screen.getAllByRole("heading", { level: 1 });
  expect(h1).toHaveLength(1);
  expect(h1[0]).toHaveTextContent(p.fullName);
  expect(screen.getByText("BSc (Hons) Computing Science Graduate")).toBeInTheDocument();
  expect(screen.getByText("Software Engineering · AI/ML · Data · Cloud")).toBeInTheDocument();
  expect(screen.getByText(p.intro)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to confirm fail; implement `Hero.tsx` + `LookingFor.tsx`**

```tsx
import { DEGREE, IDENTITY_LINE } from "@/lib/siteConfig";
import type { Profile } from "@/lib/schemas";

export function Hero({ profile }: { profile: Profile }) {
  return (
    <header id="summary" className="mx-auto max-w-3xl px-4 pt-20 pb-12">
      <h1 className="text-4xl font-bold tracking-tight">{profile.fullName}</h1>
      <p className="mt-2 text-lg">{DEGREE}</p>
      <p className="mt-1 text-[var(--muted)]">{IDENTITY_LINE}</p>
      <p className="mt-4 max-w-prose">{profile.intro}</p>
    </header>
  );
}
```

- [ ] **Step 3: Compose `web/app/page.tsx`**

```tsx
import { getProfile } from "@/lib/content";
import { Hero } from "@/components/Hero";
import { LookingFor } from "@/components/LookingFor";
import { Section } from "@/components/Section";

export default function Home() {
  const profile = getProfile();
  return (
    <main id="main">
      <Hero profile={profile} />
      <Section id="looking-for" title="What I'm Looking For">
        <LookingFor lookingFor={profile.lookingFor} />
      </Section>
      {/* skills, projects, problem-solving, achievements, cv, contact added in later tasks */}
    </main>
  );
}
```

- [ ] **Step 4: Run tests + build; confirm exactly one `<h1>` in `web/out/index.html`**

Run: `cd web && pnpm test tests/hero.test.tsx && pnpm build`
Expected: PASS; `grep -c '<h1' out/index.html` → `1`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): homepage hero (US-01) + what I'm looking for (US-02)"
```

---

### Task 12: Skills section (#skills, US-03 + US-04)

**Files:**
- Create: `web/components/SkillGroup.tsx`, `web/components/SkillsSection.tsx`
- Modify: `web/app/page.tsx`
- Test: `web/tests/skills.test.tsx`

**Interfaces:**
- Consumes: `getSkills()`.
- Produces: `<SkillsSection groups />` renders one block per group: `<h3>` group name, a context sentence, and the skill list. No percentages, bars, `<progress>`, `<meter>`, or `role="progressbar"` anywhere.

- [ ] **Step 1: Write the failing test `web/tests/skills.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { SkillsSection } from "@/components/SkillsSection";
import { getSkills } from "@/lib/content";

test("renders every group with a context sentence and no proficiency meters", () => {
  const { groups } = getSkills();
  const { container } = render(<SkillsSection groups={groups} />);
  for (const g of groups) {
    expect(screen.getByRole("heading", { name: g.name })).toBeInTheDocument();
    expect(screen.getByText(g.context)).toBeInTheDocument();
  }
  expect(container.querySelector("progress, meter, [role='progressbar']")).toBeNull();
  expect(container.textContent).not.toMatch(/\d+\s?%/);
});

test("cloud services stay nested under AWS, not top-level", () => {
  const { groups } = getSkills();
  const cloud = groups.find((g) => /cloud/i.test(g.name))!;
  expect(cloud.skills.some((s) => /^AWS \(/.test(s))).toBe(true);
  expect(cloud.skills).not.toContain("S3");
  expect(cloud.skills).not.toContain("Step Functions");
});
```

- [ ] **Step 2: Run to confirm fail; implement both components**

`SkillGroup.tsx` renders `<h3>{name}</h3>`, `<p>{context}</p>`, `<ul>` of `skills`. `SkillsSection.tsx` maps groups → `<SkillGroup>`.

- [ ] **Step 3: Run tests; add `<Section id="skills">` to `page.tsx`; build**

Run: `cd web && pnpm test tests/skills.test.tsx && pnpm build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(web): grouped skills section (US-03/US-04), no percentages"
```

---

### Task 13: Projects list + ProjectCard (#projects, US-05 teaser layer)

**Files:**
- Create: `web/components/ProjectCard.tsx`, `web/components/ProjectsSection.tsx`
- Modify: `web/app/page.tsx`
- Test: `web/tests/projects-section.test.tsx`

**Interfaces:**
- Consumes: `getProjects()`.
- Produces: `<ProjectsSection projects />` renders one `<ProjectCard>` per project: title (`<h3>`), `summary`, a technology-name list, and a "Read the full case study" link to `/projects/<slug>/`. If `githubUrl` present, a GitHub link; if `demoUrl` present, a demo link; absent links are simply not rendered (no dead links — spec §8.3).

- [ ] **Step 1: Write the failing test `web/tests/projects-section.test.tsx`**

```tsx
import { render, screen, within } from "@testing-library/react";
import { ProjectsSection } from "@/components/ProjectsSection";
import { getProjects } from "@/lib/content";

test("each card links to its case study and omits absent links", () => {
  const projects = getProjects();
  render(<ProjectsSection projects={projects} />);
  for (const p of projects) {
    const card = screen.getByRole("article", { name: p.frontmatter.title });
    expect(within(card).getByRole("link", { name: /read the full case study/i })).toHaveAttribute(
      "href",
      `/projects/${p.frontmatter.slug}/`,
    );
    if (!p.frontmatter.demoUrl) {
      expect(within(card).queryByRole("link", { name: /live demo/i })).toBeNull();
    }
  }
});
```

- [ ] **Step 2: Run to confirm fail; implement components**

`ProjectCard.tsx` renders `<article aria-label={title}>`. Conditionally render GitHub/demo `<a>` only when the URL exists.

- [ ] **Step 3: Run tests; add `<Section id="projects">` to `page.tsx`; build**

Run: `cd web && pnpm test tests/projects-section.test.tsx && pnpm build`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(web): projects teaser section + ProjectCard (US-05)"
```

---

### Task 14: Problem-solving teasers (#problem-solving) + Achievements timeline (#achievements, US-09)

**Files:**
- Create: `web/components/ProblemSolvingTeasers.tsx`, `web/components/Timeline.tsx`, `web/components/AchievementsSection.tsx`
- Modify: `web/app/page.tsx`, `web/lib/schemas.ts` (add `problemSolvingTeaserSchema`), `web/content/profile.json` (add `problemSolvingTeasers` array) OR new `web/content/problem-solving.json`
- Test: `web/tests/achievements.test.tsx`

**Interfaces:**
- Consumes: `getAchievements()`, and `getProblemSolvingTeasers()` (new in `content.ts`).
- Produces:
  - `getProblemSolvingTeasers(dir?): { title: string; teaser: string }[]` — 1–3 short entries (MVP shows teasers only; full pages are Phase 2).
  - `<Timeline items />` — `<ol>` newest-first; each `<li>` has date, title, detail, optional evidence link.
  - `<AchievementsSection items />` wraps `<Timeline>`.

- [ ] **Step 1: Add `problemSolvingTeaserSchema` + `problemSolving.json` content + loader**

Schema: `z.object({ teasers: z.array(z.object({ title: z.string().min(1), teaser: z.string().min(1).max(280) })).min(1) })`. Add `getProblemSolvingTeasers` to `content.ts` mirroring `getSkills`.

- [ ] **Step 2: Write the failing test `web/tests/achievements.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { Timeline } from "@/components/Timeline";

const items = [
  { date: "2025-06", title: "BSc (Hons) Computing Science", detail: "First class." },
  { date: "2024-08", title: "Software Engineering Internship", detail: "12 weeks.", evidenceUrl: "https://example.com" },
];

test("timeline is an ordered list, newest first, with evidence links where present", () => {
  render(<Timeline items={items} />);
  const entries = screen.getAllByRole("listitem");
  expect(entries[0]).toHaveTextContent("2025-06");
  expect(entries[1]).toHaveTextContent("2024-08");
  expect(screen.getByRole("link", { name: /evidence/i })).toHaveAttribute("href", "https://example.com");
});
```

- [ ] **Step 3: Run to confirm fail; implement `Timeline.tsx`, `AchievementsSection.tsx`, `ProblemSolvingTeasers.tsx`**

- [ ] **Step 4: Run tests; add both `<Section>`s to `page.tsx` in order (#problem-solving before #achievements); build**

Run: `cd web && pnpm test tests/achievements.test.tsx && pnpm build`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): problem-solving teasers + achievements timeline (US-09)"
```

---

### Task 15: Project detail pages — /projects/[slug] + CaseStudy (US-05, US-06)

**Files:**
- Create: `web/app/projects/[slug]/page.tsx`, `web/components/CaseStudy.tsx`
- Modify: `web/lighthouserc.json` (replace `_SAMPLE_` with a real slug)
- Test: `web/tests/case-study.test.tsx`

**Interfaces:**
- Consumes: `getProjects()`, `getProject()`.
- Produces:
  - `generateStaticParams()` → one entry per project slug (static export requirement).
  - Per-page `generateMetadata()` → title = project title, description = summary, `alternates.canonical` = `/projects/<slug>/`.
  - `<CaseStudy project />` renders (in order): `<h1>` title, summary, Problem, Solution, Technologies (name + why), My contribution, Key technical decisions (decision + rejected alternative), Results, What I learned, the rendered Markdown body, and — when `architectureImage` set — an `<img>` with `architectureImageAlt`, explicit `width`/`height`, `loading="lazy"`. GitHub/demo links rendered only when present.

- [ ] **Step 1: Write the failing test `web/tests/case-study.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { CaseStudy } from "@/components/CaseStudy";
import { getProjects } from "@/lib/content";

test("case study shows why-per-technology and the rejected alternative for each decision", () => {
  const project = getProjects()[0];
  render(<CaseStudy project={project} />);
  expect(screen.getByRole("heading", { level: 1, name: project.frontmatter.title })).toBeInTheDocument();
  for (const t of project.frontmatter.technologies) {
    expect(screen.getByText(new RegExp(t.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeInTheDocument();
    expect(screen.getByText(t.why)).toBeInTheDocument();
  }
  for (const d of project.frontmatter.decisions) {
    expect(screen.getByText(d.rejectedAlternative)).toBeInTheDocument();
  }
});
```

- [ ] **Step 2: Run to confirm fail; implement `CaseStudy.tsx` and the route**

```tsx
// web/app/projects/[slug]/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getProjects, getProject } from "@/lib/content";
import { CaseStudy } from "@/components/CaseStudy";

export function generateStaticParams() {
  return getProjects().map((p) => ({ slug: p.frontmatter.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getProject(params.slug);
  if (!p) return {};
  return {
    title: p.frontmatter.title,
    description: p.frontmatter.summary,
    alternates: { canonical: `/projects/${p.frontmatter.slug}/` },
  };
}

export default function ProjectPage({ params }: { params: { slug: string } }) {
  const project = getProject(params.slug);
  if (!project) notFound();
  return <main id="main"><CaseStudy project={project} /></main>;
}
```

Body Markdown rendered with `<div dangerouslySetInnerHTML={{ __html: project.bodyHtml }} />` (trusted, `html:false` at source).

- [ ] **Step 3: Update `web/lighthouserc.json`** — replace `projects/_SAMPLE_/index.html` with `projects/<real-slug>/index.html`.

- [ ] **Step 4: Run tests + build; confirm per-project HTML exists**

Run: `cd web && pnpm test tests/case-study.test.tsx && pnpm build`
Expected: PASS; `web/out/projects/<slug>/index.html` exists for each project.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): /projects/[slug] static pages + CaseStudy (US-05/US-06)"
```

---

### Task 16: /cv + #cv section (US-10), /privacy (§5.6), not-found (/404)

**Files:**
- Create: `web/app/cv/page.tsx`, `web/app/privacy/page.tsx`, `web/app/not-found.tsx`, `web/components/CvSection.tsx`
- Modify: `web/app/page.tsx`
- Test: `web/tests/cv.test.tsx`

**Interfaces:**
- Consumes: `getProfile()`.
- Produces:
  - `<CvSection />` — "Download CV (PDF)" link to `/cv.pdf` + a link to `/cv` (HTML mirror).
  - `/cv` page — HTML version of the CV content (headings, roles, dates) mirroring the PDF; single `<h1>` "Curriculum Vitae".
  - `/privacy` page — states: what the contact form collects (name, email, message), that it is emailed and not stored by the site, provider-log caveat, and how to reach the owner directly.
  - `/404` (`not-found.tsx`) — branded, single `<h1>`, link back to `/`.

- [ ] **Step 1: Write the failing test `web/tests/cv.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { CvSection } from "@/components/CvSection";

test("CV section offers a PDF download and links to the HTML CV", () => {
  render(<CvSection />);
  expect(screen.getByRole("link", { name: /download cv \(pdf\)/i })).toHaveAttribute("href", "/cv.pdf");
  expect(screen.getByRole("link", { name: /read the cv on this site|html/i })).toHaveAttribute("href", "/cv");
});
```

- [ ] **Step 2: Run to confirm fail; implement the section, the three routes**

`/cv` content is authored HTML/JSX mirroring the PDF. `/privacy` copy is fixed prose per Global Constraints. `not-found.tsx` returns `<main id="main"><h1>Page not found</h1><a href="/">Back to home</a></main>`.

- [ ] **Step 3: Run tests; add `<Section id="cv">` to `page.tsx`; build**

Run: `cd web && pnpm test tests/cv.test.tsx && pnpm build`
Expected: PASS; `web/out/cv/index.html`, `web/out/privacy/index.html`, `web/out/404.html` exist.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(web): /cv, /privacy, /404 + homepage CV section (US-10)"
```

---

### Task 17: sitemap, robots, Open Graph image, favicons, project images

**Files:**
- Create: `web/app/sitemap.ts`, `web/app/robots.ts`, `web/public/og.png` (1200×630), `web/public/favicon.ico` + `web/app/icon.png`, project architecture images under `web/public/projects/`
- Modify: `web/content/projects/*.md` (point `architectureImage` at the real files)
- Test: `web/tests/sitemap.test.ts`

**Interfaces:**
- Consumes: `getProjects()`, `SITE_URL`.
- Produces: `sitemap()` → array of `{ url, lastModified }` for `/`, `/cv`, `/privacy`, and every `/projects/<slug>/`. `robots()` → allow all + `sitemap: `${SITE_URL}/sitemap.xml``.

- [ ] **Step 1: Write the failing test `web/tests/sitemap.test.ts`**

```ts
import { expect, test } from "vitest";
import sitemap from "@/app/sitemap";
import { getProjects } from "@/lib/content";

test("sitemap lists home, cv, privacy and every project", () => {
  const urls = sitemap().map((e) => e.url);
  expect(urls.some((u) => u.endsWith("/"))).toBe(true);
  expect(urls.some((u) => u.endsWith("/cv/") || u.endsWith("/cv"))).toBe(true);
  for (const p of getProjects()) {
    expect(urls.some((u) => u.includes(`/projects/${p.frontmatter.slug}`))).toBe(true);
  }
});
```

- [ ] **Step 2: Run to confirm fail; implement `sitemap.ts` + `robots.ts`**

- [ ] **Step 3: Add assets**

Create `og.png` at exactly 1200×630 (name + identity line, meets contrast). Add favicon set. Add real architecture images (AVIF/WebP, ≤1600px wide, compressed) for the ≥2 projects that declared them; update those `.md` front-matter paths.

- [ ] **Step 4: Run tests + build; check `web/out/sitemap.xml` and `web/out/robots.txt`**

Run: `cd web && pnpm test tests/sitemap.test.ts && pnpm build`
Expected: PASS; both files present in `out/`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): sitemap, robots, OG image, favicons, project diagrams"
```

---

## Phase 1 — Contact service (Go)

### Task 18: Request validation (`validate.go`)

**Files:**
- Create: `contact/validate.go`, `contact/validate_test.go`

**Interfaces:**
- Produces:
  - `type ContactRequest struct { Name, Email, Message, Website string }` with JSON tags `name`, `email`, `message`, `website`.
  - `type FieldErrors map[string]string`
  - `func Validate(r ContactRequest) FieldErrors` — `{}` when valid; keys `name|email|message` with reasons `required|too_long|invalid`. Limits: name ≤ 100, email ≤ 200, message ≤ 5000 runes. Email must match `^[^@\s]+@[^@\s]+\.[^@\s]+$`.
  - `func IsSpam(r ContactRequest, elapsedSeconds float64) bool` — true if `Website` non-empty (trimmed) or `elapsedSeconds < 3`.

- [ ] **Step 1: Write the failing table-driven test `contact/validate_test.go`**

```go
package main

import "testing"

func TestValidate(t *testing.T) {
	long := make([]byte, 5001)
	for i := range long {
		long[i] = 'a'
	}
	cases := []struct {
		name string
		in   ContactRequest
		want []string // field keys expected
	}{
		{"ok", ContactRequest{Name: "Ada", Email: "ada@example.com", Message: "Hello there"}, nil},
		{"missing all", ContactRequest{}, []string{"name", "email", "message"}},
		{"bad email", ContactRequest{Name: "Ada", Email: "nope", Message: "hi"}, []string{"email"}},
		{"message too long", ContactRequest{Name: "Ada", Email: "ada@example.com", Message: string(long)}, []string{"message"}},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got := Validate(c.in)
			if len(got) != len(c.want) {
				t.Fatalf("got %v want keys %v", got, c.want)
			}
			for _, k := range c.want {
				if _, ok := got[k]; !ok {
					t.Fatalf("missing key %q in %v", k, got)
				}
			}
		})
	}
}

func TestIsSpam(t *testing.T) {
	if !IsSpam(ContactRequest{Website: "http://x"}, 10) {
		t.Fatal("honeypot filled should be spam")
	}
	if !IsSpam(ContactRequest{}, 1) {
		t.Fatal("sub-3s fill should be spam")
	}
	if IsSpam(ContactRequest{}, 9) {
		t.Fatal("clean + slow should not be spam")
	}
}
```

- [ ] **Step 2: Run to confirm fail**

Run: `cd contact && go test ./...`
Expected: FAIL — undefined `Validate`, `IsSpam`, `ContactRequest`.

- [ ] **Step 3: Implement `contact/validate.go`**

```go
package main

import (
	"regexp"
	"strings"
	"unicode/utf8"
)

const (
	maxName    = 100
	maxEmail   = 200
	maxMessage = 5000
)

var emailRe = regexp.MustCompile(`^[^@\s]+@[^@\s]+\.[^@\s]+$`)

type ContactRequest struct {
	Name    string `json:"name"`
	Email   string `json:"email"`
	Message string `json:"message"`
	Website string `json:"website"` // honeypot: must be empty
}

type FieldErrors map[string]string

func Validate(r ContactRequest) FieldErrors {
	fe := FieldErrors{}
	name := strings.TrimSpace(r.Name)
	email := strings.TrimSpace(r.Email)
	msg := strings.TrimSpace(r.Message)

	switch {
	case name == "":
		fe["name"] = "required"
	case utf8.RuneCountInString(name) > maxName:
		fe["name"] = "too_long"
	}
	switch {
	case email == "":
		fe["email"] = "required"
	case utf8.RuneCountInString(email) > maxEmail:
		fe["email"] = "too_long"
	case !emailRe.MatchString(email):
		fe["email"] = "invalid"
	}
	switch {
	case msg == "":
		fe["message"] = "required"
	case utf8.RuneCountInString(msg) > maxMessage:
		fe["message"] = "too_long"
	}
	return fe
}

func IsSpam(r ContactRequest, elapsedSeconds float64) bool {
	if strings.TrimSpace(r.Website) != "" {
		return true
	}
	return elapsedSeconds < 3
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `cd contact && go test ./...`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(contact): request validation + honeypot/fill-time spam check"
```

---

### Task 19: IP rate limiter (`ratelimit.go`)

**Files:**
- Create: `contact/ratelimit.go`, `contact/ratelimit_test.go`

**Interfaces:**
- Produces:
  - `type FixedWindowLimiter struct { ... now func() time.Time }`
  - `func NewFixedWindowLimiter(limit int, window time.Duration) *FixedWindowLimiter`
  - `func (l *FixedWindowLimiter) Allow(key string) bool` — records the attempt and returns whether the key is within `limit` per rolling `window`. Concurrency-safe. `now` is overridable in tests.

- [ ] **Step 1: Write the failing test `contact/ratelimit_test.go`**

```go
package main

import (
	"testing"
	"time"
)

func TestFixedWindowLimiter(t *testing.T) {
	now := time.Unix(0, 0)
	l := NewFixedWindowLimiter(5, time.Minute)
	l.now = func() time.Time { return now }

	for i := 0; i < 5; i++ {
		if !l.Allow("1.2.3.4") {
			t.Fatalf("request %d should be allowed", i)
		}
	}
	if l.Allow("1.2.3.4") {
		t.Fatal("6th request in window must be blocked")
	}
	if !l.Allow("5.6.7.8") {
		t.Fatal("a different IP is independent")
	}
	now = now.Add(61 * time.Second)
	if !l.Allow("1.2.3.4") {
		t.Fatal("window elapsed — should be allowed again")
	}
}
```

- [ ] **Step 2: Run to confirm fail, then implement `contact/ratelimit.go`**

```go
package main

import (
	"sync"
	"time"
)

type FixedWindowLimiter struct {
	mu     sync.Mutex
	limit  int
	window time.Duration
	hits   map[string][]time.Time
	now    func() time.Time
}

func NewFixedWindowLimiter(limit int, window time.Duration) *FixedWindowLimiter {
	return &FixedWindowLimiter{
		limit:  limit,
		window: window,
		hits:   make(map[string][]time.Time),
		now:    time.Now,
	}
}

func (l *FixedWindowLimiter) Allow(key string) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	cutoff := l.now().Add(-l.window)
	kept := l.hits[key][:0]
	for _, t := range l.hits[key] {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	if len(kept) >= l.limit {
		l.hits[key] = kept
		return false
	}
	l.hits[key] = append(kept, l.now())
	return true
}
```

- [ ] **Step 3: Run tests to confirm pass**

Run: `cd contact && go test -race ./...`
Expected: PASS, no race warnings.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(contact): in-memory per-IP fixed-window rate limiter"
```

---

### Task 20: Mailer interface + Resend implementation + fake

**Files:**
- Create: `contact/mailer.go`, `contact/mailer_resend.go`, `contact/mailer_resend_test.go`

**Interfaces:**
- Produces:
  - `type Message struct { FromName, FromEmail, Body string }`
  - `type Mailer interface { Send(ctx context.Context, m Message) error }`
  - `func NewResendMailer(apiKey, from, to string) *ResendMailer` — POSTs to `https://api.resend.com/emails`; non-2xx → error. HTTP client is injectable via an unexported field for tests (`httpDo func(*http.Request) (*http.Response, error)`).

- [ ] **Step 1: Write the failing test `contact/mailer_resend_test.go`**

```go
package main

import (
	"context"
	"io"
	"net/http"
	"strings"
	"testing"
)

func TestResendMailer_SendErrorsOnNon2xx(t *testing.T) {
	m := NewResendMailer("k", "from@example.com", "to@example.com")
	m.httpDo = func(*http.Request) (*http.Response, error) {
		return &http.Response{StatusCode: 422, Body: io.NopCloser(strings.NewReader(`{"message":"bad"}`))}, nil
	}
	if err := m.Send(context.Background(), Message{FromName: "A", FromEmail: "a@b.com", Body: "hi"}); err == nil {
		t.Fatal("expected error on 422")
	}
}

func TestResendMailer_SendOKon2xx(t *testing.T) {
	m := NewResendMailer("k", "from@example.com", "to@example.com")
	m.httpDo = func(r *http.Request) (*http.Response, error) {
		if r.Header.Get("Authorization") != "Bearer k" {
			t.Fatalf("missing auth header")
		}
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(`{"id":"x"}`))}, nil
	}
	if err := m.Send(context.Background(), Message{FromName: "A", FromEmail: "a@b.com", Body: "hi"}); err != nil {
		t.Fatalf("unexpected: %v", err)
	}
}
```

- [ ] **Step 2: Run to confirm fail; implement `mailer.go` + `mailer_resend.go`**

```go
// mailer.go
package main

import "context"

type Message struct {
	FromName  string
	FromEmail string
	Body      string
}

type Mailer interface {
	Send(ctx context.Context, m Message) error
}
```

```go
// mailer_resend.go
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type ResendMailer struct {
	apiKey string
	from   string
	to     string
	httpDo func(*http.Request) (*http.Response, error)
}

func NewResendMailer(apiKey, from, to string) *ResendMailer {
	return &ResendMailer{apiKey: apiKey, from: from, to: to, httpDo: http.DefaultClient.Do}
}

func (m *ResendMailer) Send(ctx context.Context, msg Message) error {
	payload := map[string]any{
		"from":     m.from,
		"to":       []string{m.to},
		"reply_to": msg.FromEmail,
		"subject":  fmt.Sprintf("Profile site contact from %s", msg.FromName),
		"text":     fmt.Sprintf("From: %s <%s>\n\n%s", msg.FromName, msg.FromEmail, msg.Body),
	}
	b, _ := json.Marshal(payload)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://api.resend.com/emails", bytes.NewReader(b))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+m.apiKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := m.httpDo(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("resend: status %d: %s", resp.StatusCode, string(body))
	}
	return nil
}
```

- [ ] **Step 3: Run tests to confirm pass; commit**

```bash
cd contact && go test ./...
git add -A && git commit -m "feat(contact): Mailer interface + Resend implementation"
```

---

### Task 21: HTTP handler (`handler.go`) — wire validation + anti-spam + rate limit + mailer

**Files:**
- Create: `contact/handler.go`, `contact/handler_test.go`

**Interfaces:**
- Consumes: `Validate`, `IsSpam`, `FixedWindowLimiter`, `Mailer`.
- Produces:
  - `type Deps struct { Mailer Mailer; Limiter *FixedWindowLimiter; Origin string; Logger *slog.Logger; Alert func(error); Now func() time.Time }`
  - `func ContactHandler(d Deps) http.HandlerFunc` implementing the §6.4 contract exactly. Sets CORS headers only when `Origin` header equals `d.Origin`. `OPTIONS` → `204`. Body capped at 64 KB. Spam → `200 {ok:true}` (no send). `429` before body parse when limiter denies. `502` + `d.Alert(err)` + `Logger.Error` on mailer failure. **Never writes submitted field values into any response body.**
  - `func clientIP(r *http.Request) string` — first `X-Forwarded-For` hop, else `RemoteAddr` host.

- [ ] **Step 1: Write the failing test `contact/handler_test.go`**

```go
package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

type fakeMailer struct {
	calls int
	err   error
}

func (f *fakeMailer) Send(context.Context, Message) error { f.calls++; return f.err }

func newTestHandler(m Mailer) (http.HandlerFunc, *bool) {
	alerted := false
	d := Deps{
		Mailer:  m,
		Limiter: NewFixedWindowLimiter(5, time.Minute),
		Origin:  "https://example.com",
		Logger:  slog.New(slog.NewТextHandler(io.Discard, nil)),
		Alert:   func(error) { alerted = true },
		Now:     func() time.Time { return time.UnixMilli(10_000) },
	}
	return ContactHandler(d), &alerted
}

func post(h http.HandlerFunc, body map[string]any) *httptest.ResponseRecorder {
	b, _ := json.Marshal(body)
	req := httptest.NewRequest(http.MethodPost, "/api/contact", bytes.NewReader(b))
	req.Header.Set("Origin", "https://example.com")
	req.RemoteAddr = "9.9.9.9:1234"
	rec := httptest.NewRecorder()
	h(rec, req)
	return rec
}

func validBody() map[string]any {
	return map[string]any{"name": "Ada", "email": "ada@example.com", "message": "Hello, I have a role.", "website": "", "renderedAt": 1000}
}

func TestContact_Success(t *testing.T) {
	fm := &fakeMailer{}
	h, _ := newTestHandler(fm)
	rec := post(h, validBody())
	if rec.Code != 200 || fm.calls != 1 {
		t.Fatalf("code=%d calls=%d", rec.Code, fm.calls)
	}
}

func TestContact_ValidationError_NoReflection(t *testing.T) {
	fm := &fakeMailer{}
	h, _ := newTestHandler(fm)
	body := validBody()
	body["email"] = "not-an-email"
	body["message"] = "SENSITIVE-SECRET-TEXT"
	rec := post(h, body)
	if rec.Code != 400 {
		t.Fatalf("code=%d", rec.Code)
	}
	if bytes.Contains(rec.Body.Bytes(), []byte("SENSITIVE-SECRET-TEXT")) {
		t.Fatal("response must not reflect submitted content")
	}
	var out map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &out)
	if out["error"] != "validation" {
		t.Fatalf("body=%s", rec.Body.String())
	}
}

func TestContact_Honeypot_LooksSuccessfulbutNoSend(t *testing.T) {
	fm := &fakeMailer{}
	h, _ := newTestHandler(fm)
	body := validBody()
	body["website"] = "http://spam"
	rec := post(h, body)
	if rec.Code != 200 || fm.calls != 0 {
		t.Fatalf("code=%d calls=%d", rec.Code, fm.calls)
	}
}

func TestContact_RateLimited(t *testing.T) {
	fm := &fakeMailer{}
	h, _ := newTestHandler(fm)
	for i := 0; i < 5; i++ {
		post(h, validBody())
	}
	rec := post(h, validBody())
	if rec.Code != 429 {
		t.Fatalf("code=%d", rec.Code)
	}
}

func TestContact_SendFailure_502_and_Alert(t *testing.T) {
	fm := &fakeMailer{err: errors.New("provider down")}
	h, alerted := newTestHandler(fm)
	rec := post(h, validBody())
	if rec.Code != 502 || !*alerted {
		t.Fatalf("code=%d alerted=%v", rec.Code, *alerted)
	}
}

func TestContact_CORS_OptionsPreflight(t *testing.T) {
	fm := &fakeMailer{}
	h, _ := newTestHandler(fm)
	req := httptest.NewRequest(http.MethodOptions, "/api/contact", nil)
	req.Header.Set("Origin", "https://example.com")
	rec := httptest.NewRecorder()
	h(rec, req)
	if rec.Code != 204 || rec.Header().Get("Access-Control-Allow-Origin") != "https://example.com" {
		t.Fatalf("code=%d acao=%q", rec.Code, rec.Header().Get("Access-Control-Allow-Origin"))
	}
}
```

Note: fix the two deliberate typos when transcribing (`slog.NewTextHandler`).

- [ ] **Step 2: Run to confirm fail**

Run: `cd contact && go test ./...`
Expected: FAIL — `ContactHandler` undefined.

- [ ] **Step 3: Implement `contact/handler.go`**

```go
package main

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"strings"
	"time"
)

type Deps struct {
	Mailer  Mailer
	Limiter *FixedWindowLimiter
	Origin  string
	Logger  *slog.Logger
	Alert   func(error)
	Now     func() time.Time
}

type contactBody struct {
	ContactRequest
	RenderedAt int64 `json:"renderedAt"`
}

func ContactHandler(d Deps) http.HandlerFunc {
	now := d.Now
	if now == nil {
		now = time.Now
	}
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Vary", "Origin")
		if r.Header.Get("Origin") == d.Origin {
			w.Header().Set("Access-Control-Allow-Origin", d.Origin)
			w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
		}
		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusNoContent)
			return
		}
		if r.Method != http.MethodPost {
			writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"ok": false, "error": "method"})
			return
		}

		ip := clientIP(r)
		if !d.Limiter.Allow(ip) {
			writeJSON(w, http.StatusTooManyRequests, map[string]any{"ok": false, "error": "rate_limited"})
			return
		}

		var body contactBody
		dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 64*1024))
		if err := dec.Decode(&body); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "error": "validation", "fields": map[string]string{"_": "malformed"}})
			return
		}

		elapsed := now().Sub(time.UnixMilli(body.RenderedAt)).Seconds()
		if IsSpam(body.ContactRequest, elapsed) {
			writeJSON(w, http.StatusOK, map[string]any{"ok": true}) // look fine to bots; do not send
			return
		}
		if fe := Validate(body.ContactRequest); len(fe) > 0 {
			writeJSON(w, http.StatusBadRequest, map[string]any{"ok": false, "error": "validation", "fields": fe})
			return
		}

		if err := d.Mailer.Send(r.Context(), Message{
			FromName:  strings.TrimSpace(body.Name),
			FromEmail: strings.TrimSpace(body.Email),
			Body:      body.Message,
		}); err != nil {
			d.Logger.Error("contact send failed", "err", err, "ip", ip)
			if d.Alert != nil {
				d.Alert(err)
			}
			writeJSON(w, http.StatusBadGateway, map[string]any{"ok": false, "error": "send_failed"})
			return
		}
		d.Logger.Info("contact sent", "ip", ip)
		writeJSON(w, http.StatusOK, map[string]any{"ok": true})
	}
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(v)
}

func clientIP(r *http.Request) string {
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		return strings.TrimSpace(strings.Split(xff, ",")[0])
	}
	host := r.RemoteAddr
	if i := strings.LastIndex(host, ":"); i != -1 {
		host = host[:i]
	}
	return host
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `cd contact && go test -race ./...`
Expected: PASS (all handler tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(contact): /api/contact handler implementing the §6.4 contract"
```

---

### Task 22: Wire `main.go` — routes, config, graceful shutdown

**Files:**
- Modify: `contact/main.go`, `contact/health_test.go` (adjust `newMux` signature)

**Interfaces:**
- Consumes: `ContactHandler`, `NewResendMailer`, `NewFixedWindowLimiter`.
- Produces: `func newMux(d Deps) *http.ServeMux` registering `GET /healthz` and `POST /api/contact` (+ `OPTIONS /api/contact`). `main()` reads `SITE_ORIGIN`, `RESEND_API_KEY`, `CONTACT_FROM`, `CONTACT_TO` via `mustEnv`, builds `Deps` with an `Alert` that logs at ERROR with an `ALERT` marker, and serves with 10s read / 15s write timeouts + 10s graceful shutdown on SIGINT/SIGTERM.

- [ ] **Step 1: Update `newMux` to take `Deps`; update `health_test.go` to pass a zero-value-safe `Deps` (health route needs none of it)**

```go
func newMux(d Deps) *http.ServeMux {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) { _, _ = w.Write([]byte("ok")) })
	mux.Handle("/api/contact", ContactHandler(d))
	return mux
}
```

`health_test.go`: `newMux(Deps{Limiter: NewFixedWindowLimiter(5, time.Minute)}).ServeHTTP(...)`.

- [ ] **Step 2: Flesh out `main()`**

```go
func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	d := Deps{
		Mailer:  NewResendMailer(mustEnv("RESEND_API_KEY"), mustEnv("CONTACT_FROM"), mustEnv("CONTACT_TO")),
		Limiter: NewFixedWindowLimiter(5, time.Minute),
		Origin:  mustEnv("SITE_ORIGIN"),
		Logger:  logger,
		Alert:   func(err error) { logger.Error("ALERT contact send_failed", "err", err) },
	}
	srv := &http.Server{
		Addr:         ":" + envOr("PORT", "8080"),
		Handler:      newMux(d),
		ReadTimeout:  10 * time.Second,
		WriteTimeout: 15 * time.Second,
	}
	go func() {
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			logger.Error("server error", "err", err)
			os.Exit(1)
		}
	}()
	logger.Info("listening", "addr", srv.Addr)
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt)
	defer stop()
	<-ctx.Done()
	sctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	_ = srv.Shutdown(sctx)
}
```

- [ ] **Step 3: Build + test + vet + vuln scan**

Run: `cd contact && go vet ./... && go test -race ./... && go build .`
Expected: all green; binary builds.

- [ ] **Step 4: Manual smoke with a fake key**

```bash
cd contact
SITE_ORIGIN=http://localhost:4321 RESEND_API_KEY=x CONTACT_FROM=a@b.com CONTACT_TO=c@d.com go run . &
curl -s localhost:8080/healthz            # -> ok
curl -s -XPOST localhost:8080/api/contact -H 'Origin: http://localhost:4321' \
  -H 'Content-Type: application/json' \
  -d '{"name":"A","email":"bad","message":"x","website":"","renderedAt":1}'   # -> 400 validation (fast fill also spam-blocked -> 200; use renderedAt far in past to test 400)
kill %1
```

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(contact): wire routes, env config, graceful shutdown"
```

---

## Phase 1 — Contact form (frontend) & integration

### Task 23: `ContactForm` component — states, honeypot, fill-time, client validation, mailto fallback

**Files:**
- Create: `web/components/ContactForm.tsx`
- Test: `web/tests/contact-form.test.tsx`

**Interfaces:**
- Consumes: `CONTACT_API_URL` from `siteConfig`.
- Produces: `<ContactForm ownerEmail={string} />` — a `"use client"` component.
  - Fields `name`, `email`, `message` each with a visible `<label htmlFor>`; errors rendered in a `<span id="{field}-error">` linked via `aria-describedby` and `aria-invalid`.
  - Hidden honeypot input `website` (off-screen, `tabIndex={-1}`, `aria-hidden` wrapper).
  - `renderedAt` captured with `useRef(Date.now())` at mount; sent in the POST body.
  - Client validation mirrors server rules (required; email regex `^[^@\s]+@[^@\s]+\.[^@\s]+$`; lengths 100/200/5000).
  - States: `idle | submitting | success | error`. Success → `<p role="status">` confirmation, fields cleared. Server `400` with `fields` → map to inline field errors, back to `idle`. Network error or non-400 non-2xx → `error` state showing `<p role="alert">` **and** a `mailto:` link to `ownerEmail` with the message pre-filled.
  - A one-line privacy note is always visible near the submit button.

- [ ] **Step 1: Write the failing test `web/tests/contact-form.test.tsx`**

```tsx
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
```

- [ ] **Step 2: Run to confirm fail**

Run: `cd web && pnpm test tests/contact-form.test.tsx`
Expected: FAIL — component missing.

- [ ] **Step 3: Implement `web/components/ContactForm.tsx`**

```tsx
"use client";
import { useRef, useState } from "react";
import { CONTACT_API_URL } from "@/lib/siteConfig";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
type Field = "name" | "email" | "message";
type Errors = Partial<Record<Field, string>>;
type Status = "idle" | "submitting" | "success" | "error";
const EMPTY = { name: "", email: "", message: "", website: "" };

export function ContactForm({ ownerEmail }: { ownerEmail: string }) {
  const renderedAt = useRef(Date.now());
  const [values, setValues] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>("idle");

  function validate(v: typeof values): Errors {
    const e: Errors = {};
    if (!v.name.trim()) e.name = "Please enter your name.";
    else if (v.name.trim().length > 100) e.name = "Name is too long.";
    if (!v.email.trim()) e.email = "Please enter your email.";
    else if (v.email.trim().length > 200) e.email = "Email is too long.";
    else if (!EMAIL_RE.test(v.email.trim())) e.email = "Please enter a valid email address.";
    if (!v.message.trim()) e.message = "Please enter a message.";
    else if (v.message.trim().length > 5000) e.message = "Message is too long (5000 characters max).";
    return e;
  }

  async function onSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const e = validate(values);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStatus("submitting");
    try {
      const res = await fetch(CONTACT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, renderedAt: renderedAt.current }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setValues({ ...EMPTY });
        setStatus("success");
        return;
      }
      if (res.status === 400 && data.fields) {
        const mapped: Errors = {};
        for (const k of ["name", "email", "message"] as Field[]) {
          if (data.fields[k]) mapped[k] = "Please check this field.";
        }
        setErrors(mapped);
        setStatus("idle");
        return;
      }
      setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  if (status === "success") {
    return <p role="status">Thanks — your message has been sent. I’ll be in touch soon.</p>;
  }

  const mailto =
    `mailto:${ownerEmail}?subject=${encodeURIComponent("Contact from profile site")}` +
    `&body=${encodeURIComponent(values.message)}`;

  const field = (name: Field, label: string, type: "input" | "textarea") => {
    const errId = `${name}-error`;
    const common = {
      id: name,
      name,
      value: values[name],
      "aria-invalid": !!errors[name],
      "aria-describedby": errors[name] ? errId : undefined,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setValues({ ...values, [name]: e.target.value }),
    };
    return (
      <p>
        <label htmlFor={name}>{label}</label>
        {type === "input" ? (
          <input {...common} type={name === "email" ? "email" : "text"} maxLength={name === "email" ? 200 : 100} />
        ) : (
          <textarea {...common} maxLength={5000} rows={6} />
        )}
        {errors[name] && <span id={errId}>{errors[name]}</span>}
      </p>
    );
  };

  return (
    <form onSubmit={onSubmit} noValidate>
      {status === "error" && (
        <p role="alert">
          Something went wrong sending your message. Please email me directly at{" "}
          <a href={mailto}>{ownerEmail}</a>.
        </p>
      )}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px" }}>
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={values.website}
          onChange={(e) => setValues({ ...values, website: e.target.value })}
        />
      </div>
      {field("name", "Name", "input")}
      {field("email", "Email", "input")}
      {field("message", "Message", "textarea")}
      <p>
        What you send (name, email, message) is emailed to me and not stored by this site. Prefer
        email? Write to <a href={`mailto:${ownerEmail}`}>{ownerEmail}</a>.
      </p>
      <button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
```

- [ ] **Step 4: Run tests to confirm pass**

Run: `cd web && pnpm test tests/contact-form.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(web): ContactForm with states, honeypot, fill-time, mailto fallback"
```

---

### Task 24: Contact section (#contact) — links that need no JS + the form

**Files:**
- Create: `web/components/ContactSection.tsx`
- Modify: `web/app/page.tsx`
- Test: `web/tests/contact-section.test.tsx`

**Interfaces:**
- Consumes: `getProfile()` (links), `<ContactForm>`.
- Produces: `<ContactSection profile />` — plain `<a>` for `mailto:`, LinkedIn, GitHub (present in server HTML, work with JS off), then `<ContactForm ownerEmail={profile.links.email} />`.

- [ ] **Step 1: Write the failing test `web/tests/contact-section.test.tsx`**

```tsx
import { render, screen } from "@testing-library/react";
import { ContactSection } from "@/components/ContactSection";
import { getProfile } from "@/lib/content";

test("contact section renders no-JS links plus the form", () => {
  const p = getProfile();
  render(<ContactSection profile={p} />);
  expect(screen.getByRole("link", { name: /email/i })).toHaveAttribute("href", `mailto:${p.links.email}`);
  expect(screen.getByRole("link", { name: /linkedin/i })).toHaveAttribute("href", p.links.linkedin);
  expect(screen.getByRole("link", { name: /github/i })).toHaveAttribute("href", p.links.github);
  expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();
});
```

- [ ] **Step 2: Run to confirm fail; implement `ContactSection.tsx`; add `<Section id="contact">` to `page.tsx` as the last section**

- [ ] **Step 3: Run tests + full unit suite + build**

Run: `cd web && pnpm test && pnpm build`
Expected: all unit tests PASS; `web/out/index.html` contains the three contact links; `grep -c '<h1' out/index.html` still `1`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat(web): #contact section — no-JS links + form (US-11)"
```

---

## Phase 1 — Quality gates & deploy

### Task 25: Playwright E2E — the five scenarios from §9.2

**Files:**
- Create: `web/e2e/homepage.spec.ts`, `web/e2e/project-nav.spec.ts`, `web/e2e/contact.spec.ts`

**Interfaces:**
- Consumes: the static `out/` build served at `baseURL` (Playwright `webServer` from Task 3).
- Produces: E2E coverage of: (1) homepage Layer-1 content in initial HTML, no console errors; (2) homepage → a project case study → GitHub link asserted; (3) contact happy path with API mocked → success; (4) contact validation error → inline errors, no request; (5) contact server failure (mock 502) → alert + `mailto:` fallback visible.

- [ ] **Step 1: Write `web/e2e/homepage.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("Layer-1 content is in the served HTML and there are no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText("Software Engineering · AI/ML · Data · Cloud")).toBeVisible();
  await expect(page.getByRole("link", { name: /linkedin/i })).toBeVisible();
  expect(errors).toEqual([]);
});
```

- [ ] **Step 2: Write `web/e2e/project-nav.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

test("home → project case study → GitHub link", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /read the full case study/i }).first().click();
  await expect(page).toHaveURL(/\/projects\/[a-z0-9-]+\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  const gh = page.getByRole("link", { name: /github/i }).first();
  await expect(gh).toHaveAttribute("href", /github\.com/);
});
```

- [ ] **Step 3: Write `web/e2e/contact.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

const API = "**/api/contact";

test("happy path shows success", async ({ page }) => {
  await page.route(API, (r) => r.fulfill({ status: 200, contentType: "application/json", body: '{"ok":true}' }));
  await page.goto("/#contact");
  await page.getByLabel(/name/i).fill("Ada");
  await page.getByLabel(/email/i).fill("ada@example.com");
  await page.getByLabel(/message/i).fill("I have a role that may suit you well.");
  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByRole("status")).toContainText(/sent/i);
});

test("client validation error blocks the request", async ({ page }) => {
  let called = false;
  await page.route(API, (r) => { called = true; r.fulfill({ status: 200, body: '{"ok":true}' }); });
  await page.goto("/#contact");
  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByText(/enter your name/i)).toBeVisible();
  expect(called).toBe(false);
});

test("server 502 shows alert and mailto fallback", async ({ page }) => {
  await page.route(API, (r) => r.fulfill({ status: 502, contentType: "application/json", body: '{"ok":false,"error":"send_failed"}' }));
  await page.goto("/#contact");
  await page.getByLabel(/name/i).fill("Ada");
  await page.getByLabel(/email/i).fill("ada@example.com");
  await page.getByLabel(/message/i).fill("Hello, here is my note to you.");
  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page.getByRole("link", { name: /@/ })).toHaveAttribute("href", /^mailto:/);
});
```

- [ ] **Step 4: Run E2E**

Run: `cd web && pnpm test:e2e`
Expected: 5 specs PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "test(web): Playwright E2E for homepage, project nav, contact flows"
```

---

### Task 26: axe accessibility scan + Lighthouse budgets + link check in CI

**Files:**
- Create: `web/e2e/a11y.spec.ts`, `web/scripts/check-links.mjs`
- Modify: `web/package.json` (add `check:links` script), `.github/workflows/ci.yml` (add link-check step)

**Interfaces:**
- Consumes: `@axe-core/playwright`, the `out/` build.
- Produces: `a11y.spec.ts` asserting zero serious/critical axe violations on `/`, `/cv/`, `/privacy/`, `/404.html`, and one `/projects/<slug>/`. `check:links` walks `out/**/*.html` and fails on any internal `href` that does not resolve to a file in `out/`.

- [ ] **Step 1: Write `web/e2e/a11y.spec.ts`**

```ts
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const path of ["/", "/cv/", "/privacy/", "/404.html"]) {
  test(`no serious/critical a11y violations: ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
    expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
  });
}

test("no serious/critical a11y violations: a project page", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /read the full case study/i }).first().click();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  const bad = results.violations.filter((v) => ["serious", "critical"].includes(v.impact ?? ""));
  expect(bad, JSON.stringify(bad, null, 2)).toEqual([]);
});
```

- [ ] **Step 2: Write `web/scripts/check-links.mjs`**

```js
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, extname } from "node:path";

const OUT = "out";
const htmls = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    statSync(p).isDirectory() ? walk(p) : extname(p) === ".html" && htmls.push(p);
  }
})(OUT);

let broken = 0;
for (const file of htmls) {
  const html = readFileSync(file, "utf8");
  for (const m of html.matchAll(/href="(\/[^"#?]*)/g)) {
    const target = m[1].endsWith("/") ? join(OUT, m[1], "index.html") : join(OUT, m[1]);
    const alt = join(OUT, m[1] + ".html");
    if (!existsSync(target) && !existsSync(alt) && !existsSync(join(OUT, m[1]))) {
      console.error(`BROKEN ${m[1]}  (in ${file})`);
      broken++;
    }
  }
}
process.exit(broken ? 1 : 0);
```

Add script: `"check:links": "node scripts/check-links.mjs"`. Add to CI `web` job after `pnpm build`: `- run: pnpm check:links`.

- [ ] **Step 3: Run all gates locally**

Run: `cd web && pnpm build && pnpm check:links && pnpm test:e2e && pnpm lhci`
Expected: all PASS. Fix any a11y/perf failures now (contrast, heading order, image dimensions, JS weight).

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "test(web): axe a11y scan, link checker; wire into CI"
```

---

### Task 27: Security headers + deploy (Vercel + Fly.io) + analytics + README/ADR

**Files:**
- Create: `web/vercel.json`, `docs/adr/0002-hosting-vercel-flyio-resend.md`
- Modify: `web/app/layout.tsx` (Cloudflare Web Analytics beacon), `README.md` (deploy + ops runbook)

**Interfaces:**
- Consumes: `SITE_URL` / `NEXT_PUBLIC_CONTACT_API_URL` (set as Vercel env vars); `SITE_ORIGIN` + email env (set as Fly.io secrets).
- Produces: `vercel.json` `headers` applying CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` to all routes; live site on the custom domain; live contact service on Fly.io; analytics beacon loaded non-blocking.

- [ ] **Step 1: Write `web/vercel.json`**

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' https://static.cloudflareinsights.com; connect-src 'self' https://cloudflareinsights.com CONTACT_API_ORIGIN; font-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains; preload" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=(), interest-cohort=()" }
      ]
    }
  ]
}
```

Replace `CONTACT_API_ORIGIN` with the Fly.io service origin once known. `style-src 'unsafe-inline'` is required by Next's inlined critical CSS in static export; no inline `<script>` is used (JSON-LD is a `type="application/ld+json"` block, allowed by `default-src 'self'`? — it is inline; add a sha256 hash of the JSON-LD content to `script-src`, computed at build, or move JSON-LD to a static `/person.jsonld` referenced via `<link rel="alternate">`). **Decision:** emit JSON-LD from a small committed static file `web/public/person.json` and reference it — no inline script.

- [ ] **Step 2: Adjust Task 9 JSON-LD to the no-inline-script approach**

Generate `web/public/person.json` in a `prebuild` script from `personJsonLd()`, and in `<head>` add `<link rel="alternate" type="application/ld+json" href="/person.json" />`. (Google accepts linked JSON-LD via a data file referenced in `<script src>`; simplest fully-CSP-safe route: a `prebuild` step writes `web/app/person-ld.tsx` containing the object as a hashed inline script and add that sha256 to CSP `script-src`.) Pick one; document it in ADR 0002.

- [ ] **Step 3: Add the Cloudflare Web Analytics beacon**

In `layout.tsx`, before `</body>`: `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='{"token":"<TOKEN>"}' />`. `<TOKEN>` comes from the Cloudflare dashboard; it is not a secret. Confirm CSP `script-src` allows `static.cloudflareinsights.com` and `connect-src` allows `cloudflareinsights.com`.

- [ ] **Step 4: Deploy the contact service to Fly.io**

```bash
cd contact
fly launch --no-deploy --copy-config --name profile-contact
fly secrets set SITE_ORIGIN=https://<domain> RESEND_API_KEY=<key> CONTACT_FROM=<verified@domain> CONTACT_TO=<inbox>
fly deploy
curl -s https://profile-contact.fly.dev/healthz   # -> ok
```

- [ ] **Step 5: Deploy the site to Vercel**

- Import the GitHub repo in Vercel; set root directory to `web/`.
- Env vars: `NEXT_PUBLIC_SITE_URL=https://<domain>`, `NEXT_PUBLIC_CONTACT_API_URL=https://profile-contact.fly.dev/api/contact`.
- Add the custom domain; verify automatic HTTPS.
- Update `vercel.json` CSP `CONTACT_API_ORIGIN` → `https://profile-contact.fly.dev`; redeploy.
- Confirm per-PR preview deploys are on.

- [ ] **Step 6: Write `docs/adr/0002-hosting-vercel-flyio-resend.md`** recording the four vendor choices, the JSON-LD/CSP approach, and the 5xx-alert mechanism (Fly.io log alert on the `ALERT` marker). Update `README.md` with a deploy + ops runbook (how to rotate the Resend key, where alerts land, how to roll back a Vercel deploy).

- [ ] **Step 7: Verify headers on the live site**

```bash
curl -sI https://<domain> | grep -Ei 'content-security-policy|strict-transport|x-content-type|referrer-policy|permissions-policy'
```

Expected: all five present.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "chore: security headers, Vercel + Fly.io deploy, analytics, ADR 0002"
```

---

### Task 28: Pre-launch manual checklist + Phase 1 Definition of Done

**Files:**
- Create: `docs/launch-checklist.md` (filled in and committed as the record)

**Interfaces:**
- Consumes: the live site + live contact service.
- Produces: a signed-off checklist proving the Phase 1 DoD from spec §11.

- [ ] **Step 1: Run the manual accessibility passes (spec §9.3)**

Keyboard-only pass of the whole site (nav, skip link, form). One screen-reader pass of the homepage and one case study. Record issues; fix; re-run.

- [ ] **Step 2: Cross-device / viewport checks**

Visual check at 320px, 768px, 1440px (no horizontal scroll at 320px; tap targets ≥ 44px). Real-device check on one iOS and one Android phone. Validate the Open Graph card with a card debugger.

- [ ] **Step 3: End-to-end live contact test**

Submit the real form once → confirm the email arrives in the inbox with a working reply-to. Temporarily break the Resend key on Fly.io → submit → confirm `502`, the UI shows the alert + `mailto:` fallback, and the `ALERT` log line fires an alert. Restore the key.

- [ ] **Step 4: Verify the Phase 1 DoD**

Confirm every MVP user story's acceptance criteria (US-01…US-13) pass; CI is green on `main` including Lighthouse ≥ 95, axe clean, link check, E2E; `pnpm audit` / `govulncheck` clean; Dependabot enabled; `README` has setup + testing + architecture; `LICENSE` present with the content-reservation note; CV PDF committed at `web/public/cv.pdf`.

- [ ] **Step 5: Tag the release and commit the checklist**

```bash
git add docs/launch-checklist.md
git commit -m "docs: Phase 1 launch checklist signed off"
git tag -a v1.0.0 -m "MVP launch"
git push --tags
```

---

## Self-Review

### 1. Spec coverage

| Spec section | Covered by |
|---|---|
| §1.4 Success measures (analytics) | Task 27 (Cloudflare Web Analytics); events beyond pageviews are Phase 2+ — noted as out of scope in Global Constraints |
| §2 Two audiences, progressive disclosure | Tasks 11–17 (Layer 1/2/3 structure); Global Constraints |
| §3.1 MVP scope | Tasks 6–28 |
| §3.3 Non-goals | Global Constraints; enforced by `output: 'export'` (no DB/API), no auth code, English-only |
| §4.1 US-01 identity copy | Task 8 (frozen constants), Task 11 (Hero, one `<h1>`), test asserts verbatim strings |
| §4.1 US-02 What I'm Looking For | Task 11 (LookingFor) |
| §4.2 US-03/US-04 grouped skills, no %, nested services, context | Task 6 (schema requires `context`), Task 12 (tests forbid `%`/`progress`/`meter`, assert AWS nesting) |
| §4.3 US-05 project fields incl. why-per-tech, rejected alternative, measurable result | Task 7 (schema + word-count + digit-in-result enforcement), Tasks 13 & 15 |
| §4.3 US-06 architecture | Task 7 (`architectureImage` + required alt), Task 15 (render), Task 17 (assets) |
| §4.4 US-07/US-08 problem-solving | Task 14 (teasers — MVP); full pages are Phase 2 per §11 (Global Constraints) |
| §4.5 US-09 achievements timeline | Task 6 (schema), Task 14 (Timeline, newest-first, evidence links) |
| §4.6 US-10 CV | Task 16 (`/cv.pdf` download + `/cv` HTML mirror), Task 10 (footer link), Task 28 (PDF committed) |
| §4.7 US-11 contact | Tasks 18–24 (service + form + section), links work without JS, honeypot, fill-time, rate limit, privacy note, success/failure/fallback |
| §4.8 US-12 responsive | Tailwind (Task 2), 44px targets (Task 10), Task 28 viewport checks |
| §4.9 US-13 performance | Task 2 (`output: 'export'`, `images.unoptimized`), Task 3 + 26 (Lighthouse budgets fail CI) |
| §5.1 budgets | Task 3 `lighthouserc.json`, Task 26 |
| §5.2 accessibility | Task 2 (SkipLink, reduced-motion), Task 10 (Section heading order), Task 26 (axe gate), Task 28 (manual passes) |
| §5.3 SEO | Task 9 (metadata, OG, Person JSON-LD), Task 17 (sitemap, robots, OG image) |
| §5.4 browser support / no-JS | Tasks 10, 16, 24 (server-rendered links); Task 3 Playwright on Chromium; manual Safari/Firefox in Task 28 |
| §5.5 security | Task 18 (length caps, email check), Task 19 (rate limit), Task 21 (no reflection, CORS), Task 27 (headers, secrets), Task 5 (`npm audit`, `govulncheck`, Dependabot in Task 1) |
| §5.6 privacy | Task 16 (`/privacy`), Task 23 (form privacy note), Task 27 (cookieless analytics) |
| §6.1–6.5 architecture | Task 2 (static export), Tasks 4/18–22 (Go contact-only), Tasks 6–7 (build-time content, no DB) |
| §6.6 version control / repo contents | Task 1 (LICENSE, README, ADR), Task 27 (runbook), Task 28 (CV) |
| §6.7 stack | Global Constraints "Decisions locked" + all tasks |
| §7 content plan | Task 7 (loader enforces word count, ≥3 projects, why-per-tech); authoring in Tasks 6–7 steps |
| §8 site structure | Task 11–17 route + anchor layout; Task 8.2 ordering realised in `page.tsx` section order; §8.3 states — Task 13 (omit absent links), Task 16 (`/404`) |
| §9 testing strategy | Task 3 (tooling), Tasks 18–23 (unit/TDD), Task 25 (E2E scenarios), Task 26 (axe + Lighthouse + links), Task 28 (manual checklist) |
| §10 deployment & ops | Task 27 (separate Vercel + Fly.io, one process per container, headers, observability via Fly log alert) |
| §10.5 Go `embed` | Not used in MVP (optional per spec); no task — intentional |
| §11 delivery plan | Phase 0 = Tasks 1–5; Phase 1 = Tasks 6–28; Phase 2/3 explicitly excluded |
| §12 risks | Content-first: Task 7 gates ≥3 real case studies before deploy; over-claiming: schema `context`/quality bar; scope creep: phases; deliverability: Resend + Task 28 live test; abuse: Tasks 19/21; host lock-in: standard export + `Mailer` interface |

No spec requirement is left without a task, except the two explicitly-optional items (§1.4 advanced event analytics, §10.5 `embed`) which are noted as deliberate omissions.

### 2. Placeholder scan

- No "TBD/TODO/handle edge cases" steps. Vendor tokens that are genuinely environment-specific (`<domain>`, Cloudflare `<TOKEN>`, Fly app origin, Resend key) are passed only through named env vars / `vercel.json` substitution documented in Task 27 — not left as code placeholders.
- Task 27 Step 2 offers two CSP-safe JSON-LD approaches and instructs the implementer to **pick one and record it in ADR 0002** — that is a real decision point with both options spelled out, not a placeholder.
- `lighthouserc.json` `_SAMPLE_` slug is explicitly replaced in Task 15 Step 3.

### 3. Type consistency

- `ContactRequest` JSON tags (`name/email/message/website`) match the form POST body (Task 23) and the §6.4 contract.
- `contactBody` embeds `ContactRequest` + `renderedAt int64` (epoch ms); the form sends `renderedAt: renderedAt.current` (ms) — consistent.
- Error response shape `{ ok:false, error:"validation", fields:{...} }` is produced by Task 21 and consumed by Task 23 (`res.status === 400 && data.fields`).
- `Mailer.Send(ctx, Message)` signature identical across `mailer.go`, `mailer_resend.go`, `fakeMailer` (Task 21), and `main.go`.
- `newMux` takes `Deps` in both Task 22 and the updated `health_test.go`.
- Frontend loader names (`getProfile/getSkills/getAchievements/getProjects/getProject/getProblemSolvingTeasers`) are used consistently in Tasks 6–17.
- `SITE_URL` / `CONTACT_API_URL` (frontend) vs `SITE_ORIGIN` (Go CORS) — deliberately distinct names, wired in Tasks 8, 22, 27.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-09-04-profile-site-mvp.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
