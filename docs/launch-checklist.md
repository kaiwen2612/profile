# Phase 1 Launch Checklist — Pre-Launch Verification & Definition of Done

**Date:** 2026-09-05
**Verified against:** first pass at commit `61ff224`; a real gap was found (below),
fixed, and re-verified at commit (see §0). `main`, working tree clean, no remote
configured.
**Scope:** This is the scoped-down version of Task 28 run in a sandbox with no live
deployment. Everything that can be verified without a live Fly.io/Vercel deployment
was run for real, below, with real output. Everything that requires a live site or
literal human sensory judgment is listed as an explicit pending item at the bottom —
none of it is simulated or assumed.

---

## 0. Fix applied after first pass — read this first

The first verification pass (recorded in full below, for the record — do not delete
this history) found a genuine, deterministic failure: `pnpm lhci`'s best-practices
gate scored `0.96` instead of the required `1.0`, and `homepage.spec.ts`'s
zero-console-errors assertion flaked ~50% of the time under repeated runs. Root
cause: `web/app/layout.tsx` hardcoded the Cloudflare Web Analytics beacon with a
placeholder token (`data-cf-beacon='{"token":"REPLACE_ME"}'`), which made the browser
fire a real request to `cloudflareinsights.com` on every page load, in every
environment (dev, CI, Lighthouse, Playwright), that got rejected by CORS and logged
as a real console error.

**Fix:** the beacon is now guarded behind an env var, the same pattern already used
for `SITE_URL`/`CONTACT_API_URL`:

- `web/lib/siteConfig.ts` — added `export const CF_BEACON_TOKEN = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN ?? "";`
- `web/app/layout.tsx` — the beacon `<script>` now only renders when `CF_BEACON_TOKEN`
  is non-empty: `{CF_BEACON_TOKEN && <script defer src="..." data-cf-beacon={...} />}`.
  In dev/CI the env var is unset, so the script doesn't render at all — no placeholder
  token, no network call, no console error. Confirmed by grepping the built
  `out/index.html`: zero occurrences of `cloudflareinsights`/`cf-beacon`.
- `web/.env.example` — added `NEXT_PUBLIC_CF_BEACON_TOKEN=` (name only, no value).
- `README.md` — the "Wire the real origins" step (step 4) no longer instructs
  hand-editing `layout.tsx`; it now instructs setting `NEXT_PUBLIC_CF_BEACON_TOKEN`
  as a Vercel env var in step 3, alongside the other `NEXT_PUBLIC_*` vars.

**Full re-verification after the fix (§1a below) is genuinely green, including three
consecutive full `pnpm test:e2e` runs and a 10x single-worker repeat of the
previously-flaky `homepage.spec.ts` test, confirming the flake is gone, not just
reduced.** The `v1.0.0-mvp` tag has been created (see §5).

---

## 1. Automated re-verification — FIRST PASS (commit `61ff224`, before the fix)

This section is preserved as the historical record of what was actually found. See
§1a below for the post-fix re-verification.

### `web/` — Node 25.9.0 / pnpm 11.25.0

| Command | Result | Notes |
|---|---|---|
| `pnpm lint` | ✅ PASS (exit 0) | One pre-existing warning only: `@next/next/no-img-element` in `components/CaseStudy.tsx:95` — expected, `next.config.mjs` sets `images.unoptimized: true` for static export, so `next/image` optimization isn't available anyway. |
| `pnpm typecheck` | ✅ PASS (exit 0) | `tsc --noEmit`, no output. |
| `pnpm test` | ✅ PASS | 15 test files, 32 tests, all passed. |
| `pnpm build` | ✅ PASS | `next build` → static export, 12/12 pages generated, `out/` produced. |
| `pnpm check:links` | ✅ PASS (exit 0, silent) | `scripts/check-links.mjs` walks every `.html` in `out/` and every `href="/..."`; no broken internal links. |
| `pnpm test:e2e` | ✅ PASS on the recorded run (10/10) | **See "E2E flakiness — investigated" below — two real, reproducible flakes were found during repeated verification and must be disclosed.** |
| `pnpm lhci` | ❌ **FAIL, deterministic** | best-practices `minScore: 1` assertion fails at `0.96` on both tested pages, every run (6/6 samples across two full `lhci` invocations = 0.96 both times). **See "Lighthouse best-practices gate — root cause" below.** |
| `pnpm audit --audit-level=high --ignore GHSA-jmr9-qjv8-65gv` | ✅ PASS | `No new vulnerabilities were ignored` — clean. |

Real `pnpm test:e2e` output (the recorded, current-state run):

```
Running 10 tests using 4 workers

  ✓ e2e/homepage.spec.ts:3:5 › Layer-1 content is in the served HTML and there are no console errors (380ms)
  ✓ e2e/project-nav.spec.ts:3:5 › home → project case study → GitHub link (479ms)
  ✓ e2e/contact.spec.ts:13:5 › happy path shows success (485ms)
  ✓ e2e/contact.spec.ts:24:5 › client validation error blocks the request (144ms)
  ✓ e2e/a11y.spec.ts:5:7 › no serious/critical a11y violations: / (767ms)
  ✓ e2e/contact.spec.ts:37:5 › server 502 shows alert and mailto fallback (221ms)
  ✓ e2e/a11y.spec.ts:5:7 › no serious/critical a11y violations: /cv/ (374ms)
  ✓ e2e/a11y.spec.ts:5:7 › no serious/critical a11y violations: /privacy/ (406ms)
  ✓ e2e/a11y.spec.ts:5:7 › no serious/critical a11y violations: /404.html (373ms)
  ✓ e2e/a11y.spec.ts:13:5 › no serious/critical a11y violations: a project page (465ms)

  10 passed (15.7s)
```

Real `pnpm lhci` output (the recorded, current-state run):

```
1 result(s) for http://localhost:64315/index.html :
  ✘ categories.best-practices failure for minScore assertion
        expected: >=1
           found: 0.96
      all values: 0.96, 0.96, 0.96

1 result(s) for http://localhost:64315/projects/api-service/index.html :
  ✘ categories.best-practices failure for minScore assertion
        expected: >=1
           found: 0.96
      all values: 0.96, 0.96, 0.96

Assertion failed. Exiting with status code 1.
```

All other Lighthouse categories/budgets are comfortably green (confirmed by reading the
raw LHR JSON for all 6 runs): `performance = 1.0`, `accessibility = 1.0`, `seo = 1.0`,
LCP ≈ 1.72s (budget `< 2000ms`), CLS = `0` (budget `< 0.1`), total byte weight ≈
137–140 KB (budget `< 512000` bytes). The *only* failing signal is `best-practices`,
and it is caused entirely by one audit.

#### Lighthouse best-practices gate — root cause (real finding, not fabricated)

The failing audit is `errors-in-console`, with this exact logged error on both pages,
reproduced 12/12 times across two independent `lhci` runs:

```
Access to XMLHttpRequest at 'https://cloudflareinsights.com/cdn-cgi/rum' from origin
'http://localhost:PORT' has been blocked by CORS policy: Response to preflight request
doesn't pass access control check: The 'Access-Control-Allow-Origin' header has a value
'http://localhost' that is not equal to the supplied origin.
Failed to load resource: net::ERR_FAILED
```

Root cause: `web/app/layout.tsx` unconditionally injects the Cloudflare Web Analytics
beacon script (`https://static.cloudflareinsights.com/beacon.min.js`) with the
placeholder token `data-cf-beacon='{"token":"REPLACE_ME"}'` (added in Task 27, not yet
replaced with a real token per the README's deploy runbook step 4). With an invalid
token, Cloudflare's endpoint responds to the beacon's RUM XHR without a matching CORS
header for the local origin, so the browser logs a real console error on every page
load — including in Lighthouse's headless Chrome and in Playwright. This is
**deterministic, not a flake** — script is `defer`red so it doesn't block rendering
(so `performance` stays at 1.0 and the literal "ships no blocking third-party
scripts" wording of US-13 still holds), but it does fire a real network call and log a
real console error, which the Lighthouse `best-practices` category penalizes.

This was introduced in Task 27 (which added the beacon) and was not caught then —
Task 27's own verification section ran `pnpm build`, `pnpm test`, `pnpm test:e2e`,
`pnpm typecheck`, `pnpm lint`, but never re-ran `pnpm lhci` after the layout.tsx
change, so this regression sat undetected until this task's full end-to-end re-run.
GitHub Actions' `ubuntu-latest` runners have normal internet egress (confirmed by
reading `.github/workflows/ci.yml` — no egress restriction is configured), so **this
would fail the real `lhci` step of CI on `main` right now, exactly as it failed
here.**

This is flagged as a genuine, unresolved DoD gap below (see §3, US-13) rather than
smoothed over. It is plausible — but **not verified**, since there is no live
deployment or real Cloudflare token to test with — that setting a real token against
a real registered domain (per README step 4) would let the RUM beacon's CORS
preflight succeed and make this error disappear in production. That hypothesis must
be confirmed for real once the live deployment exists (see the Pending section), and
either way this repo's `main` branch cannot claim a green `lhci` CI run today.

#### E2E flakiness — investigated (two distinct, reproducible flakes found)

Because "run every quality gate one more time, end to end" was taken literally, the
suite was re-run repeatedly (not just once) to check reliability, and this surfaced
two real flakes:

**Flake 1 — pre-existing, already known (Task 26 flagged it), still present.**
`e2e/contact.spec.ts:37 "server 502 shows alert and mailto fallback"` occasionally
fails with a Playwright strict-mode violation: `page.getByRole('alert')` matches two
elements — the app's own `<p role="alert">` and Next.js's built-in route-announcer
(`node_modules/next/dist/esm/client/components/app-router-announcer.js` creates a
`<div id="__next-route-announcer__" role="alert" aria-live="assertive">` in a shadow
root on mount, which Playwright's `getByRole` pierces). Reproduced once in the default
4-worker run on this pass; reran with `--workers=1 --repeat-each=5` → 15/15 passed,
confirming (as Task 26 already found) this is a worker-scheduling race in the test's
locator specificity, not a product bug — the real alert and mailto fallback do work
(see `tests/contact-form.test.tsx:45` for the unit-level equivalent, which passes
deterministically with no such collision). Low severity; a one-line future fix would
scope the locator to `page.locator("#contact").getByRole("alert")`.

**Flake 2 — new, found during this task's re-verification, same root cause as the
Lighthouse failure above.** `e2e/homepage.spec.ts:3 "...there are no console errors"`
asserts `errors.toEqual([])` after collecting all `console` `error`-type events. Reran
with `--repeat-each=8 --workers=1`: **4 of 8 runs failed** with the identical
`cloudflareinsights.com` CORS error described above. This is a real, current,
network-dependent flake in the E2E suite with a ~50% failure rate observed in this
environment, caused by the same placeholder analytics token making a real outbound
call during every test run. Since GitHub Actions runners have normal internet egress,
this is a real risk to CI reliability on `main`, not just a local sandbox artifact.

Neither flake was fixed as part of this task — the brief scopes Task 28 to producing
`docs/launch-checklist.md`, not to modifying `layout.tsx` or the E2E specs — but both
are disclosed here in full per the "report honestly, don't smooth over" instruction.

### `web/` — automated viewport check (proxy for spec §9.3's manual visual check)

A temporary Playwright spec (`e2e/viewport-check.spec.ts`, written for this task, run,
then **deleted** — not kept as a permanent suite member, since it's a narrow one-off
proxy check rather than a maintained regression test) loaded `/` at three viewport
widths and asserted `document.documentElement.scrollWidth <=
document.documentElement.clientWidth`:

```
Running 3 tests using 1 worker

  ✓ no horizontal scroll at 320px (mobile) (285ms)
  ✓ no horizontal scroll at 768px (tablet) (98ms)
  ✓ no horizontal scroll at 1440px (desktop) (108ms)

  3 passed (13.6s)
```

**Result: ✅ PASS at all three widths — no horizontal scroll at 320px, 768px, or
1440px.** This is a legitimate automated proxy for "no horizontal scrolling at 320px"
(part of US-12's acceptance criteria) but does **not** replace an actual human visual
check of layout quality, image cropping, or spacing at each breakpoint, nor a real
tap-target measurement on a real touchscreen — those remain manual/pending (below).

### `contact/` — Go 1.27.1 (module targets 1.23)

| Command | Result |
|---|---|
| `go vet ./...` | ✅ PASS (exit 0, no output) |
| `go test -race ./...` | ✅ PASS — `ok github.com/kaiwenchang/personal-profile-site/contact 1.557s` |
| `go test -race -coverprofile=cover.out ./...` | ✅ PASS — `coverage: 75.9% of statements` |
| `govulncheck ./...` (`$(go env GOPATH)/bin/govulncheck`, already installed) | ✅ PASS — `No vulnerabilities found.` |

---

## 1a. Automated re-verification — SECOND PASS, after the fix (genuinely green)

Full suite re-run end-to-end after the beacon fix (§0). Every command below was run
for real, in order, in this pass.

### `web/`

| Command | Result |
|---|---|
| `pnpm lint` | ✅ PASS (exit 0) — same one pre-existing `<img>` warning as before, unrelated to the fix. |
| `pnpm typecheck` | ✅ PASS (exit 0), no output. |
| `pnpm test` | ✅ PASS — 15 files, 32 tests. |
| `pnpm build` | ✅ PASS — 12/12 pages, `out/` produced. Confirmed `out/index.html` contains zero occurrences of `cloudflareinsights`/`cf-beacon` (beacon correctly absent with no token set). |
| `pnpm check:links` | ✅ PASS (exit 0, silent). |
| `pnpm audit --audit-level=high --ignore GHSA-jmr9-qjv8-65gv` | ✅ PASS — "No new vulnerabilities were ignored". |

`pnpm test:e2e` — run **three consecutive times** (not once), as instructed, to
confirm the flake is actually gone:

```
Run 1: Running 10 tests using 4 workers → 10 passed (14.4s)
Run 2: Running 10 tests using 4 workers → 10 passed (14.0s)
Run 3: Running 10 tests using 4 workers → 10 passed (14.1s)
```

All 10 tests passed all 3 times, including both previously-flaky tests
(`contact.spec.ts:37` and `homepage.spec.ts:3`). To confirm the console-error flake
specifically is gone and not just statistically luckier, `homepage.spec.ts` was
additionally stress-tested on its own:

```
$ npx playwright test e2e/homepage.spec.ts --repeat-each=10 --workers=1
Running 10 tests using 1 worker
  ✓ ×10 "...there are no console errors" (all ~120-134ms)
10 passed (17.1s)
```

**10/10 — deterministic, not just "less flaky."** This matches the diagnosis: with no
token, the beacon script never renders, so there is no network call to fail and
nothing to log.

`pnpm lhci` — run twice to confirm determinism:

```
Run 1: Checking assertions against 2 URL(s), 6 total run(s) → All results processed! (exit 0)
Run 2: Checking assertions against 2 URL(s), 6 total run(s) → All results processed! (exit 0)
```

Read back the raw LHR JSON for both runs (12 total samples) to confirm real scores,
not just "no assertion configured for this":

```
index.html:              perf=1  a11y=1  seo=1  best-practices=1   (×6 samples)
projects/api-service:    perf=1  a11y=1  seo=1  best-practices=1   (×6 samples)
```

**`best-practices` is now a genuine `1.0` on every sample, both pages — the
`errors-in-console` audit that was previously failing now has nothing to report,
since the beacon script (the only thing that was ever generating a console error)
no longer renders without a real token.** Performance/accessibility/SEO remain
perfect as before; LCP/CLS/byte-weight were unaffected by this fix (already passing).

### `contact/`

| Command | Result |
|---|---|
| `go vet ./...` | ✅ PASS (exit 0) |
| `go test -race ./...` | ✅ PASS |
| `govulncheck ./...` | ✅ PASS — "No vulnerabilities found." |

**Every automated gate this task can run is now genuinely green — nothing simulated,
nothing rounded up.** `.lighthouseci/` build artifacts were removed after verification
and `git status` was confirmed clean before committing.

---

## 2. Definition-of-Done audit — US-01 through US-13

Legend: ✅ mechanism/code fully implements and is tested to the acceptance criteria.
⚠️ mechanism/code is correct and tested, but a real, disclosed gap remains (content or
CI reliability). ❌ acceptance criteria not met.

| Story | Verdict | Citation | Notes |
|---|---|---|---|
| **US-01** Understand who I am | ⚠️ | `web/content/profile.json` (fullName, degree, identityLine, intro fields); `web/components/Hero.tsx`; `web/tests/hero.test.tsx:5` "hero shows the one h1 and the fixed identity lines" (passes); identity line confirmed present in raw `out/index.html` with no JS. | **Mechanism ✅** — single `<h1>`, exact frozen wording, server-rendered, verified in built HTML. **Content ⚠️** — `profile.json`'s `intro`, and `links.linkedin`/`links.github` are still literal placeholder text (`"Replace this with a 1-2 sentence introduction..."`, `https://linkedin.com/in/REPLACE_ME`, `https://github.com/REPLACE_ME`) — this placeholder intro is also what ships in the `og:description`/`twitter:description` meta tags right now. Real content must be authored before real launch; this is the known, tracked risk from spec §12 ("content-first risk"), not a code defect — the loader has no way to mechanically detect "is this real prose," only shape/structure. |
| **US-02** What I'm looking for | ⚠️ | `web/content/profile.json` `lookingFor` block; `web/components/LookingFor.tsx`; rendered inside `#looking-for`, one scroll from the top (confirmed in `e2e/homepage.spec.ts:3` and manually in `out/index.html`). | **Mechanism ✅.** **Content ⚠️** — `roleTypes`, `domains`, `location` are all still `"Replace with target role types, e.g. Software Engineer"` etc. — placeholder, not real. |
| **US-03** Grouped skills, no % | ✅ | `web/content/skills.json` (4 real groups: Languages, AI/ML, Cloud & Infrastructure, Web & Tooling); `web/tests/skills.test.tsx:5` "renders every group with a context sentence and no proficiency meters" — asserts `container.querySelector("progress, meter, [role='progressbar']")` is null and `container.textContent` has no `\d+\s?%` pattern. Passes. | Skills content is real (not placeholder) and correctly grouped. |
| **US-04** Nested tech, w/ context, backed by claim | ✅ | `web/tests/skills.test.tsx:16` "cloud services stay nested under AWS, not top-level" — asserts `AWS (` prefix, not bare `S3`/`Lambda` as peers; every group in `skills.json` carries a non-empty `context` sentence (schema-enforced, `web/lib/content.ts`). | Meets criteria; Go's context line literally says "wrote the contact API for this site" — a claim genuinely backed by this repo's own `contact/` service. |
| **US-05** View selected projects | ⚠️ | `web/content/projects/*.md` (3 files: `api-service.md`, `data-processing-pipeline.md`, `web-application.md`); `web/lib/content.ts:81-85` enforces 400–800 words per body (throws otherwise); `web/lib/projects.test.ts:26` "every project body is 400–800 words" and `:33` "at least one project states a measurable result (contains a digit)" — both pass; each project has a stable `/projects/<slug>` route (`app/projects/[slug]/page.tsx`, confirmed built at `out/projects/{api-service,data-processing-pipeline,web-application}/index.html`); `web/tests/case-study.test.tsx:5` "case study shows why-per-technology and the rejected alternative for each decision" passes. | **Mechanism ✅** — schema requires a `why` per technology (non-empty, asserted `lib/projects.test.ts:21`), a `rejectedAlternative` per decision, a `result` field, stable URLs, word-count gate. Only 3 projects committed (spec wants 3–5; 3 satisfies the floor). **Content ❌ placeholder** — all 3 files are explicitly self-labeled `[TEMPLATE]` in the title, and every field literally says "TEMPLATE PLACEHOLDER — replace with..." including the body text itself, which opens with "This is placeholder template content — replace with a real project case study before launch (spec §7.1)... Do not ship this file as-is." None of this is real project data, a real GitHub link, or a real measurable result — it is illustrative generic prose written to satisfy the word-count/shape gates as a demonstration. **This must be authored with real content before real launch; it is the single largest concrete gap found in this audit.** |
| **US-06** Project architecture | ⚠️ | `content/projects/api-service.md` and `data-processing-pipeline.md` both set `architectureImage`/`architectureImageAlt`; SVGs exist at `web/public/projects/api-service-architecture.svg` and `data-processing-pipeline-architecture.svg`, each with `role="img"`, a `<title>`, and a `<desc>` for screen readers. 2 of 3 launch projects have a diagram (meets "at least 2"). | **Mechanism ✅.** **Content ⚠️** — diagrams are honest, generic, illustrative placeholders (`api-service-architecture.svg`: "Client → API service → Database", 3 boxes) matching the placeholder project text, not "real components and their interactions" from an actual system, per spec's explicit acceptance wording. Will be accurate once real project content and a matching real diagram are authored. |
| **US-07/US-08** Problem-solving, mistakes/lessons | ✅ (MVP scope) | `web/content/problem-solving.json` (3 teaser items); `web/components/*` rendering teasers under `#problem-solving`. Per the plan's own self-review ("Task 14 (teasers — MVP); full pages are Phase 2 per §11"), the spec's own US-07/US-08 acceptance criteria explicitly say "at Phase 2" / "Phase 2 includes ≥1 failure/recovery story" — full case-study pages with the quality bar (named numbers, ≥2 rejected options, measurable outcome) are **out of MVP/Phase 1 scope by design**, not a gap. | Teaser content itself is still placeholder text (`[TEMPLATE] Debugging a tricky production issue`, etc.) — same content-authoring gap as US-05, but the *feature* (teasers linking toward future full write-ups) is correctly Phase-1-scoped and implemented. |
| **US-09** Achievements timeline | ⚠️ | `web/content/achievements.json`; `web/lib/content.ts:45` sorts `items` newest-first (`a.date < b.date`); `web/tests/achievements.test.tsx:9` "timeline is an ordered list, newest first, with evidence links where present" passes. | **Mechanism ✅.** **Content ❌ placeholder** — `achievements.json` contains exactly one item: `{"date": "2026", "title": "Your Degree Title Here", "detail": "Replace with real details."}`. This is not a real achievements timeline; it must be populated with real degree/internship/certification/award entries before launch. |
| **US-10** Access the CV | ✅ | `web/components/CvSection.tsx:9-13` "Download CV (PDF)" control on homepage; `web/components/Footer.tsx:15-16` same control in footer; `web/app/cv/page.tsx` HTML mirror at `/cv`; `web/tests/cv.test.tsx:4` "CV section offers a PDF download and links to the HTML CV" passes; `web/public/cv.pdf` exists, confirmed via `file` = "PDF document, version 1.4, 1 pages" (valid, not a stub) and is committed (845 bytes — a real, if minimal, single-page CV). README's "Testing"/CV note covers keeping it consistent. | Fully met. (Whether the CV's actual resume content is complete/final is a content question for the site owner, same category as US-01/05/09, but the PDF is a genuinely valid, parseable file, not an empty placeholder.) |
| **US-11** Contact the candidate | ✅ | Email/LinkedIn/GitHub rendered as real server-rendered `<a>` tags in `ContactSection.tsx`/`Footer.tsx` (no-JS-required, confirmed in static `out/` HTML); form fields have associated `<label>`s (`ContactForm.tsx`); success state `role="status"` (`ContactForm.tsx:98`); failure state `role="alert"` + prefilled `mailto:` fallback (`ContactForm.tsx:102-104`, `tests/contact-form.test.tsx:45` "server failure shows an alert AND a prefilled mailto fallback" passes); honeypot field `Website` (`contact/validate.go:21`); fill-time check `contact/handler.go:59` (`elapsed := now().Sub(time.UnixMilli(body.RenderedAt))`); server-side rate limit `contact/main.go:41` → `NewFixedWindowLimiter(5, time.Minute)` = 5 req/min/IP exactly per spec's example; privacy note `ContactForm.tsx:127` "emailed to me and not stored"; failed-send `ALERT` log `contact/main.go:44` `logger.Error("ALERT contact send_failed", ...)`. | Fully met at the code/mechanism level; this is the most thoroughly tested story in the repo (Go unit tests + Vitest + Playwright all cover it). The **live** send-and-break test against a real Fly.io deployment is pending (see below) — that is a live-environment step, not a code gap. |
| **US-12** Responsive, any device | ✅ (automated proxy) | Tailwind responsive classes throughout; `min-h-11` (44px) tap targets on every interactive control (`CvSection.tsx`, `Footer.tsx`, `Navbar.tsx`, `ContactSection.tsx`, confirmed via grep — present on all nav links, CV/download links, social links, contact-method links); automated viewport check above confirms no horizontal scroll at 320/768/1440px. | Real-device check (iOS + Android) and literal on-screen tap-target measurement remain pending manual steps (below) — a `min-h-11` CSS class is strong evidence but not the same as touching a real screen. |
| **US-13** Load quickly | ✅ | `next.config.mjs:3` `output: "export"` (pre-rendered at build time); `next.config.mjs:5` `images: { unoptimized: true }`; Lighthouse `performance = 1.0`, `best-practices = 1.0`, LCP ≈ 1.72s, CLS = 0, byte weight ≈ 140KB — all comfortably inside budget (see §1a raw LHR data above, post-fix). Analytics beacon (`web/lib/siteConfig.ts` `CF_BEACON_TOKEN`, `web/app/layout.tsx`) now only renders when a real token is configured, so it is non-render-blocking *and* generates no console error in dev/CI, satisfying both "ships no blocking third-party scripts" and the `lhci` best-practices gate. | **Originally found failing** (see §1, first pass): `best-practices` scored 0.96 due to the placeholder analytics token causing a real CORS-blocked console error on every load. **Fixed during this task** (§0) by guarding the beacon behind an env var; re-verified genuinely green (§1a, 12/12 samples at exactly 1.0 across two independent `lhci` runs). This is now a full ✅, not a caveat. |

### Audit summary

- **Fully green, no caveats:** US-03, US-04, US-10, US-11 (code/mechanism), US-12 (automated proxy), **US-13 (fixed during this task — see §0/§1a)**.
- **Mechanism/code correct, but content is still placeholder (expected, tracked risk, not a code defect):** US-01, US-02, US-05, US-06, US-09, and the US-07/US-08 teasers.
- **Genuine, already-known-and-accepted flake, still present, not fixed (out of this task's scope — a test-locator specificity issue, not a product bug):** the `contact.spec.ts` route-announcer race (Task 26 flagged this as out-of-scope-for-that-task; still true here; not related to the beacon fix).
- **Genuine gap found and fixed during this task:** the `pnpm lhci` best-practices failure and the `homepage.spec.ts` console-error flake both shared one root cause (the hardcoded placeholder analytics token) and were both resolved by the same fix (§0), confirmed by re-verification (§1a: 12/12 lhci samples at 1.0, and 10/10 + three full-suite runs + a 10x repeat-each stress test all green for the previously-flaky test).

---

## 3. Repo completeness check

| Item | Status | Evidence |
|---|---|---|
| `LICENSE` | ✅ | MIT license, 21 lines, real copyright holder (`Kai Wen Chang`, 2026), standard full MIT text — not a stub. |
| `README.md` | ✅ | 137 lines. Has Setup (`## Setup`), Testing (`## Testing`), Architecture (`## Architecture`), and a full Deploy runbook (`## Deploy`, 7 numbered steps: GitHub push, Fly.io deploy, Vercel deploy, placeholder replacement, header verification, key rotation, rollback) plus a licence note distinguishing MIT code from all-rights-reserved content — substantive, not a stub. |
| `docs/adr/` | ✅ | Both ADRs present: `0001-static-build-no-read-api.md`, `0002-hosting-vercel-flyio-resend.md`. |
| `web/public/cv.pdf` | ✅ | Valid PDF (`file` reports "PDF document, version 1.4, 1 pages"), 845 bytes, committed. |
| `.github/dependabot.yml` | ✅ | Weekly updates configured for all 3 ecosystems: `npm` (`/web`), `gomod` (`/contact`), `github-actions` (`/`). |

All five repo-completeness items are genuinely present and substantive.

---

## 4. Pending — requires live deployment

None of the following can be done in this sandbox (no live Fly.io/Vercel deployment
exists, and no remote is configured). They are **not simulated or assumed complete** —
they are explicit, ordered follow-up work for the human site owner:

1. **Run Task 27's README deploy runbook** (`README.md` → "Deploy" section, steps 1–7):
   push to a real GitHub remote, `fly launch`/`fly deploy` the contact service, import
   the repo into Vercel with the `NEXT_PUBLIC_*` env vars (including the now-optional
   `NEXT_PUBLIC_CF_BEACON_TOKEN` once analytics is set up — §0 above), then replace
   the one remaining local placeholder (`web/vercel.json`'s `https://REPLACE_ME.fly.dev`
   CSP entry) with the real Fly.io origin and redeploy. **While doing this, also run
   `pnpm lhci` against the real deployed domain with the real analytics token set**
   as a final confirmation that the beacon's RUM call succeeds against a real
   registered domain/token in production (expected to pass, by the same logic that
   made it fail with a placeholder — an invalid token was the entire cause — but not
   yet observed against a real domain, since none exists in this sandbox).
2. **Real live contact-form test:** submit the real form once and confirm the email
   arrives with a working reply-to; then temporarily break the `RESEND_API_KEY` on
   Fly.io, submit again, and confirm the `502` fallback UI (alert + prefilled
   `mailto:`) and the `ALERT contact send_failed` log line actually fire in
   production; then restore the key.
3. **Real keyboard-only pass** of the whole live site (nav, skip link, form) by an
   actual person using only a keyboard.
4. **Real screen-reader pass** (VoiceOver or NVDA) of the homepage and one case-study
   page.
5. **Real-device check** on one physical iOS phone and one physical Android phone
   (in addition to the automated 320/768/1440px viewport proxy already run above).
6. **Validate the Open Graph card** with a real card-debugger tool (LinkedIn Post
   Inspector or opengraph.xyz) once a real domain exists — note that today's `og:`
   meta tags still carry the placeholder intro text (see US-01 above), so this step
   should happen only after real profile content is authored, or the card debugger
   will simply confirm that the placeholder text renders correctly, which is not
   useful.

Additionally, not explicitly listed in the brief's six items but surfaced by this
audit and belonging in the same "before real launch" bucket: **author real content**
for `web/content/profile.json` (intro, lookingFor, linkedin/github links),
`web/content/projects/*.md` (all 3 files, currently 100% template placeholder),
`web/content/achievements.json` (currently one placeholder item), and
`web/content/problem-solving.json` (3 placeholder teasers) — see the DoD audit table
above for exactly which fields in which files. This was a known, named risk in the
spec (§12, "content-first risk") from the start of the plan, not a surprise.

---

## 5. Git tag decision

**`v1.0.0-mvp` tag created** (local only, not pushed — no remote is configured, and
pushing is outside this task's authority regardless):

```
git tag -a v1.0.0-mvp -m "MVP implementation complete — pending live deployment (see docs/launch-checklist.md)"
```

The first pass (§1) found a genuine, deterministic `pnpm lhci` failure plus a related
E2E flake, both traced to one root cause (a hardcoded placeholder analytics token in
`web/app/layout.tsx`) and both fixed by guarding the beacon behind
`NEXT_PUBLIC_CF_BEACON_TOKEN` (§0). Full re-verification after the fix (§1a) is
genuinely green across every automated gate this task can run, including three
consecutive full `pnpm test:e2e` runs and a 10x repeat-each stress test of the
previously-flaky assertion — so the tag now reflects real, current, reproducible
green state, not a hopeful projection. The one remaining known flake
(`contact.spec.ts`'s route-announcer race, §1/§2) is a pre-existing, already-disclosed,
low-severity test-locator issue (Task 26), unrelated to this fix, and does not block
tagging by the controller's explicit instruction.
