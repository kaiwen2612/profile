# Personal Profile Site — Specifications Document

**Project:** Personal Professional Profile Site
**Purpose:** Give recruiters and hiring managers concrete evidence of what I can do and how I work — evidence that does not fit in a CV.
**Status:** Draft v2

---

## Table of Contents

1. Problem & Goals
2. Target Audience
3. Scope
4. User Stories & Acceptance Criteria
5. Non-Functional Requirements
6. Architecture & Technology Stack
7. Content Plan
8. Website Structure
9. Testing Strategy
10. Deployment & Operations
11. Delivery Plan
12. Risks & Open Decisions

---

# 1. Problem & Goals

## 1.1 Background

My CV summarises my education, experience, skills and projects, but a CV has limited space.

For example, my CV can list:

> Python — Machine Learning — AWS — Flutter — Go

but this does not show an employer **how I have actually used these technologies**, nor:

- How I approach difficult problems
- How I make technical decisions
- How I test my work
- What I learned from mistakes
- How I improve a solution
- What I can contribute to a team

I want a **personal professional profile site** that complements the CV by providing evidence, not by repeating it.

## 1.2 Main Problem

> **How can I create a professional website that lets recruiters and hiring managers quickly understand who I am, what I can do, and how I approach software development?**

The site should move a visitor through three stages:

1. **"Who is this candidate?"**
2. **"I understand what this candidate can do."**
3. **"I would like to talk to this candidate."**

## 1.3 Goals

The website should:

1. Present my professional identity clearly.
2. Showcase my technical skills, grouped and with context.
3. Showcase 3–5 selected projects in depth.
4. Demonstrate how I solve problems and make technical decisions.
5. Showcase achievements and experience.
6. Provide easy access to my CV.
7. Provide easy, low-friction ways to contact me.
8. Work well on desktop, tablet and mobile.
9. Look professional rather than flashy.
10. Be measurably fast and accessible (see Section 5).

The site favours **quality and evidence over feature count**.

## 1.4 Success Measures

The funnel in 1.2 is only useful if I can tell whether it works. I will track, using a privacy-respecting analytics tool (see 10.4):

| Signal | What it tells me | Rough target (first 3 months) |
|---|---|---|
| Homepage → project page rate | Are visitors going deeper than the summary? | ≥ 30% of homepage sessions |
| Project page → GitHub / demo clicks | Is the technical evidence compelling? | ≥ 15% of project-page sessions |
| Contact section reached | Are visitors getting to the ask? | ≥ 10% of sessions |
| Contact form submissions / mailto clicks | The actual outcome | Trend upward month over month |
| Median Largest Contentful Paint (field data) | Is it actually fast for real visitors? | < 2.0s |

These are directional, not contractual. The point is to have data instead of guessing.

---

# 2. Target Audience

The site has two audiences with different needs and different reading depths. The layout must serve both from the same pages via **progressive disclosure**: a skimmable top layer, with depth available on demand.

## 2.1 Recruiters — *skim in under a minute*

May not have a strong technical background. They want to know:

- Who am I, and what did I study?
- What type of roles am I interested in?
- What are my main skills?
- Do I have relevant experience?
- How do they contact me?

**What the site does for them:** the homepage answers all of the above above the fold, in plain language, without requiring them to open any project.

## 2.2 Hiring Managers — *dive into one or two projects*

Assess technical ability *and* how I work. They want to know:

- What technologies have I actually used, and how?
- What have I built?
- What problems came up, and how did I solve them?
- Why did I choose a particular technology?
- How did I test it?
- Can I explain my decisions?
- How do I respond when an approach does not work?

**What the site does for them:** each selected project expands into a full case study, and a dedicated "How I Solve Problems" section gives **real, specific examples** — including at least one thing that did *not* work first time — rather than adjectives like "I am a good problem solver."

```text
Project → Problem → Approach → Technical Decisions →
Implementation → Testing → Results → What I Learned
```

## 2.3 Audience → Journey Mapping

| Audience | Entry point | Primary path | Success = |
|---|---|---|---|
| Recruiter | Homepage | Summary → Skills → "What I'm Looking For" → Contact | Sends a message or forwards the link |
| Hiring manager | Homepage or deep link | Summary → Projects → a case study → How I Solve Problems → GitHub | Opens the repo, then Contact |

---

# 3. Scope

## 3.1 In Scope — MVP (must ship first)

- Home page with professional summary, "What I'm Looking For", CV download, contact links
- Skills section, grouped, with one sentence of context per group
- 3 project case studies with the full structure in 2.2
- Contact: prominent email / LinkedIn / GitHub links **and** a working contact form
- Responsive layout (see 5.4)
- WCAG 2.1 AA conformance (see 5.2)
- SEO basics: metadata, Open Graph image, sitemap, `Person` structured data (see 5.3)
- Deployed, publicly reachable over HTTPS on a custom domain
- Public GitHub repo with README, setup and testing instructions

## 3.2 In Scope — Later Phases

- "How I Solve Problems" section with 2 case studies, one of which is a failure/recovery story
- Achievements & Experience section
- Architecture diagrams for at least 2 projects
- Project list filtering by technology
- Dark mode
- Standalone Go project repo, linked from the site, to demonstrate backend depth

## 3.3 Non-Goals (explicitly out of scope)

- Any database
- A CMS or admin UI — content is edited as files via pull request
- User accounts, login, or any authentication
- A blog engine (a static "notes" list may be added later, but not a CMS)
- Internationalisation / multiple languages — English only
- Long-term storage of contact submissions
- A pixel-for-pixel reproduction of the CV
- Analytics beyond the handful of signals in 1.4

---

# 4. User Stories & Acceptance Criteria

Format: **As a [user], I want to [action], so that [reason].**

Every story has acceptance criteria so it can be tested (Section 9). A story is **done** only when: criteria pass, it works at 320px and 1440px width, it passes the automated accessibility scan, and it degrades gracefully with JavaScript disabled where reasonable.

## 4.1 Homepage

### US-01 — Understand who I am

**As a visitor, I want a short introduction to the candidate, so that I can quickly understand who they are.**

Shows: name, degree, professional identity, main areas of interest, one- or two-sentence intro.

**Canonical homepage copy (single source of truth — reuse verbatim in metadata and Open Graph):**

> **[Full Name]**
> BSc (Hons) Computing Science Graduate
> Software Engineering · AI/ML · Data · Cloud
> [One–two sentence intro: what I build and what I care about.]

**Acceptance criteria**

- All five elements are visible without scrolling on a 1440×900 desktop viewport and within the first scroll on a 320px-wide viewport.
- The identity line uses the exact wording above; no competing variant elsewhere on the site.
- Rendered server-side / at build time — visible in "View Source" with no JavaScript.

### US-02 — Understand what I am looking for

**As a recruiter or hiring manager, I want to know what opportunities the candidate wants, so that I can judge whether a role fits.**

**Acceptance criteria**

- A "What I'm Looking For" block names role types, domains of interest, and location / remote preference.
- Reachable from the homepage in one click or one scroll.

## 4.2 Skills

### US-03 — View technical skills

**As a hiring manager, I want skills grouped into categories, so that I can quickly read the candidate's technical background.**

Skills are grouped, never one flat list. Sub-technologies are nested under their platform, not listed as peers:

```text
Languages
  Python, Go, Java, Dart, TypeScript

AI / Machine Learning
  PyTorch, TensorFlow, scikit-learn, XGBoost

Cloud & Infrastructure
  AWS (Lambda, S3, Step Functions), Docker

Web & Tooling
  React / Next.js, Flutter, REST API design, Git
```

**Acceptance criteria**

- Every skill sits under exactly one group.
- Cloud services (S3, Step Functions, Lambda) appear under their provider, not as top-level skills.
- No numeric proficiency bars or percentages anywhere.

### US-04 — Understand practical experience with a technology

**As a hiring manager, I want to see how a technology was used, not just its name.**

Each group (or each notable skill) carries one line of context:

> **Go** — REST/back-end services and CLI tooling in personal projects; wrote the contact API for this site.

**Acceptance criteria**

- Every skill group has at least one sentence describing real usage.
- Claims are backed by a linked project where one exists.

## 4.3 Projects

### US-05 — View selected projects

**As a hiring manager, I want to view the candidate's projects, so that I can assess practical experience.**

Each selected project contains: name, short description, problem, solution, technologies (each with the reason it was chosen), my contribution, key technical decisions (with the rejected alternative), results (with a number where possible), what I learned, GitHub link, live demo where one exists.

**Acceptance criteria**

- 3–5 projects at launch; each case study is 400–800 words.
- Every project page is reachable by a stable, shareable URL (e.g. `/projects/<slug>`).
- Each "technology" entry states *why* it was chosen, not just that it was used.
- At least one project states a measurable result.

### US-06 — Understand a project's architecture

**As a technical hiring manager, I want to see how a project is structured, so that I can assess software-engineering knowledge.**

Where relevant, a project includes: architecture diagram, API surface, data flow, and — only if the project actually has one — database design.

**Acceptance criteria**

- At least 2 launch projects include an architecture diagram (SVG or optimised image, with a text description for screen readers).
- Diagrams show real components and their interactions, not generic boxes.

## 4.4 Problem Solving

### US-07 — See how I solve problems

**As a hiring manager, I want to see how the candidate approaches hard problems, so that I can assess problem-solving ability.**

Each case study follows:

```text
Problem → Investigation → Options considered → Decision (and why) →
Implementation → Testing → Result → Lesson learned
```

**Quality bar (a case study must clear all of these):**

- Names the specific system, constraint and numbers ("processing 40k rows took 90s; budget was 10s"), not "an algorithm was slow".
- Lists at least two options that were genuinely considered, and why the others were rejected.
- States a measurable outcome.
- Draws from real project or coursework — **not** a competitive-programming puzzle used as headline evidence.

**Acceptance criteria**

- At least 2 case studies at Phase 2, each clearing the quality bar above.
- Each is independently linkable.

### US-08 — Understand mistakes and improvements

**As a hiring manager, I want to see how the candidate reacts when an approach fails, so that I can assess their ability to learn.**

At least one case study answers: *What didn't work? Why not? What did I change? What did I learn?*

**Acceptance criteria**

- Phase 2 includes ≥ 1 failure/recovery story that is specific and non-defensive.

## 4.5 Achievements

### US-09 — View achievements

**As a recruiter or hiring manager, I want to see achievements and professional development, so that I can understand the candidate's growth.**

Candidate items: degree, internship, certifications, awards, research, hackathons, presentations, open-source contributions.

**Acceptance criteria**

- Presented as a dated timeline or list, newest first.
- Each item links to evidence (certificate, repo, write-up) where one exists.
- Nothing is phrased to imply seniority the evidence does not support (see 12, over-claiming risk).

## 4.6 CV

### US-10 — Access the CV

**As a recruiter, I want to download the CV easily, so that I can review formal qualifications.**

**Acceptance criteria**

- A clearly visible "Download CV (PDF)" control on the homepage and in the footer.
- The PDF is a versioned file in the repo; a short checklist in the README covers keeping it consistent with the site on each update.
- An HTML `/cv` page mirrors the PDF content for accessibility and SEO.
- The site complements the CV; it does not duplicate it wholesale.

## 4.7 Contact

### US-11 — Contact the candidate

**As a recruiter or hiring manager, I want to contact the candidate easily, so that I can discuss opportunities.**

The site provides: email (as a `mailto:` link), LinkedIn, GitHub, **and** a contact form.

**Acceptance criteria**

- Email, LinkedIn and GitHub links work without JavaScript.
- The form has: name, email, message; all with associated `<label>`s and inline, programmatically-associated error messages.
- **Success state:** a clear confirmation message; the form clears.
- **Failure state:** an explicit error message *and* a visible fallback (`mailto:` link with the message pre-filled) so a visitor is never left with no way through.
- Anti-abuse: hidden honeypot field, minimum fill-time check, and server-side IP rate limiting (e.g. 5 requests / minute / IP).
- A one-line privacy note near the form: what is collected (name, email, message), that it is emailed to me and not stored, and how to reach me directly instead.
- Failed sends are logged and alert me, so no message is silently lost.

## 4.8 Responsive Design

### US-12 — Use the site on any device

**As a visitor, I want the site to work on desktop, tablet and mobile.**

**Acceptance criteria** — see 5.4 for the breakpoint and device-support definition. No horizontal scrolling at 320px; tap targets ≥ 44×44px; content order is logical when linearised.

## 4.9 Performance

### US-13 — Load quickly

**As a visitor, I want the site to load fast.**

**Acceptance criteria** — meets the budgets in 5.1. Content is pre-rendered at build time; the homepage ships no blocking third-party scripts.

---

# 5. Non-Functional Requirements

## 5.1 Performance Budgets

Measured with Lighthouse CI (lab) and field data (see 1.4). Homepage and project pages:

| Metric | Budget |
|---|---|
| Lighthouse Performance | ≥ 95 |
| Largest Contentful Paint (lab, mobile) | < 2.0s |
| Cumulative Layout Shift | < 0.1 |
| Interaction to Next Paint | < 200ms |
| Total JavaScript (gzipped, homepage) | < 150KB |
| Total page weight (homepage, first load) | < 500KB |

Images are served in a modern format (AVIF/WebP) with explicit `width`/`height`, lazy-loaded below the fold. Fonts are self-hosted, `woff2`, `font-display: swap`, with a system fallback stack.

## 5.2 Accessibility

Target: **WCAG 2.1 AA**. Non-negotiable for a site whose purpose is to demonstrate engineering quality.

- Semantic HTML5 landmarks; exactly one `<h1>` per page; no skipped heading levels.
- All interactive elements keyboard-operable with a visible focus indicator; logical tab order; a "skip to content" link.
- Text contrast ≥ 4.5:1 (≥ 3:1 for large text and UI components).
- All meaningful images have `alt` text; decorative images have empty `alt`.
- Form fields have visible labels; errors are associated via `aria-describedby` and announced.
- `prefers-reduced-motion` is honoured — no essential information conveyed only through motion.
- Automated `axe-core` scan passes in CI (Section 9); plus one manual keyboard-only and one screen-reader pass before launch.

## 5.3 SEO & Sharing

- Unique `<title>` and meta description per page.
- Open Graph and Twitter Card tags with a 1200×630 preview image (so a link shared in LinkedIn or Slack renders a card).
- Canonical URL per page; `sitemap.xml` and `robots.txt`.
- JSON-LD `Person` structured data on the homepage (name, job title, `sameAs` links to LinkedIn/GitHub).
- Server-rendered content — no reliance on client-side fetch for primary content.

## 5.4 Browser & Device Support

| Category | Supported |
|---|---|
| Desktop | Last 2 major versions of Chrome, Firefox, Edge, Safari |
| Mobile | iOS Safari (last 2), Chrome for Android (last 2) |
| Minimum viewport | 320px wide |
| Not supported | Internet Explorer, browsers with < 0.5% global share |

Core content (text, links, CV download) must be usable with JavaScript disabled. The contact form is the one feature allowed to require JavaScript, and it still shows the `mailto:` fallback without it.

## 5.5 Security

- HTTPS enforced (HSTS); HTTP redirects to HTTPS.
- Security headers: `Content-Security-Policy` (no inline script except hashed/nonce), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` locked down.
- Contact API: input length caps (name ≤ 100, email ≤ 200, message ≤ 5000), server-side email-format validation, honeypot + fill-time check, IP rate limiting, and no reflection of submitted content back into any HTML response.
- CORS on the contact API restricted to the site's own origin.
- Secrets (email-provider API key) supplied via environment variables / the platform secret store; never committed. `.env.example` documents the names only.
- Dependencies scanned in CI (`npm audit` / `govulncheck`); Dependabot enabled.

## 5.6 Privacy

- Analytics is cookieless / privacy-respecting (see 10.4); no consent banner required.
- Contact submissions are transmitted to my inbox via the email provider and not persisted by the application. Provider logs are subject to that provider's retention policy, noted in the privacy line.
- A short `/privacy` page states the above.

---

# 6. Architecture & Technology Stack

## 6.1 Guiding Principle

The site's content is **static and changes infrequently**. Therefore content is compiled into the site **at build time** from files in the repo. There is **no runtime API for reading content** — that would add latency, a second deployable unit, and an SEO liability for zero benefit.

The **only** dynamic behaviour is the contact form, which needs a server to talk to an email provider. That is one small endpoint.

Go is showcased in two honest ways:

1. It powers the contact endpoint (`POST /api/contact`) — real, deployed, tested Go.
2. A separate, linked standalone Go project demonstrates backend depth (routing, persistence, concurrency) without distorting this site's architecture.

## 6.2 Architecture

```text
                         Visitor
                            │
                            ▼
            ┌───────────────────────────────┐
            │   Next.js site (static)       │
            │   Pre-rendered at build time  │
            │   React + TypeScript + Tailwind│
            │   Served from a CDN            │
            └───────────────┬───────────────┘
                            │  (only for form submit)
                          HTTPS
                            │
                            ▼
            ┌───────────────────────────────┐
            │   Go contact service          │
            │   POST /api/contact           │
            │   validate · anti-spam · send │
            └───────────────┬───────────────┘
                            │
                            ▼
                     Email provider  ──►  my inbox
```

Content source of truth, compiled in at build time:

```text
content/
├── profile.json
├── skills.json
├── projects/
│   ├── <slug>.md          # case study body (front-matter + Markdown)
│   └── ...
├── problem-solving/
│   └── <slug>.md
└── achievements.json
```

**No database.** The data is small, changes rarely, and is version-controlled with the code.

## 6.3 Frontend

| Concern | Choice | Rationale |
|---|---|---|
| Framework | **Next.js** (static export / prerendered) | Build-time rendering, file-based routing, image optimisation, good SEO defaults |
| UI | **React** | Reusable components: `Navbar`, `Hero`, `SkillGroup`, `ProjectCard`, `CaseStudy`, `Timeline`, `ContactForm`, `Footer` |
| Language | **TypeScript** | Type safety across content models and components |
| Styling | **Tailwind CSS** | Consistent spacing/typography; small shipped CSS; easy responsive work |
| Content parsing | Build-time only (e.g. `gray-matter` + Markdown renderer) | Case studies authored in Markdown, rendered to HTML at build |

Design direction: professional, restrained, high-contrast, content-first. A short visual style note (type scale, colour tokens, spacing scale) lives in the repo before UI work starts.

## 6.4 Backend (contact only)

| Concern | Choice | Rationale |
|---|---|---|
| Language | **Go** | Requested; demonstrates real Go in production |
| HTTP | Go standard library `net/http` | One endpoint; no framework needed |
| Responsibilities | Parse JSON, validate, honeypot + fill-time check, rate-limit, call email provider, return typed JSON result | Small, fully testable surface |
| Email provider | One transactional provider with a free tier (Resend, Postmark, or AWS SES) — decided in Phase 0 | Abstracted behind a single `Mailer` interface so it can be swapped |

Endpoint contract:

```text
POST /api/contact
  Request : { name, email, message, website (honeypot, must be empty) }
  200     : { ok: true }
  400     : { ok: false, error: "validation", fields: { ... } }
  429     : { ok: false, error: "rate_limited" }
  502     : { ok: false, error: "send_failed" }   ← triggers UI fallback + server alert
```

## 6.5 Data Storage

None. Content is JSON/Markdown in the repo, compiled into the static build. Contact messages are not stored.

## 6.6 Version Control

Git + GitHub, public repo. The repo contains: source, README, setup instructions, architecture notes, testing instructions, screenshots, a technical-decisions log (ADR-style, short), the CV PDF, and a `LICENSE` file (MIT for code; content — case-study prose and images — reserved, stated in the README).

## 6.7 Final Technology Stack

| Area | Technology | Purpose |
|---|---|---|
| Framework | **Next.js** (static/prerendered) | Build the site, rendered at build time |
| UI | **React** | Reusable components |
| Language (frontend) | **TypeScript** | Frontend development |
| Styling | **Tailwind CSS** | Responsive styling |
| Language (backend) | **Go** | Contact endpoint |
| Backend HTTP | Go `net/http` | Single REST endpoint |
| Content | JSON + Markdown in repo | Source of truth, compiled at build time |
| Email | Transactional provider (TBD Phase 0) | Deliver contact messages |
| Hosting (site) | Static host + CDN (TBD Phase 0) | Serve prerendered site |
| Hosting (contact) | Serverless function or small container | Run the Go endpoint |
| CI/CD | GitHub Actions | Lint, test, build, quality gates, deploy |
| Analytics | Cookieless analytics (TBD Phase 0) | The signals in 1.4 |
| Containerisation | **Docker** (contact service only, one process per container) | Reproducible backend deploy |
| Database | **None** | Not needed |

---

# 7. Content Plan

Content is the hard part and the differentiator. Build effort is wasted if the case studies are thin.

## 7.1 Rules

- Write **3 project case studies in full before** building visual polish. If I cannot write three that clear the US-07 quality bar, the site is not ready.
- Every case study: 400–800 words, concrete numbers, named trade-offs, a measurable result.
- At least one "what didn't work" story (US-08).
- Claims are proportional to evidence. Personal and learning projects are labelled as such. No wording that implies commercial seniority I do not have.
- Prefer real project/coursework problems over competitive-programming anecdotes.

## 7.2 Authoring Workflow

1. Draft case study as Markdown in `content/`.
2. Open a pull request; self-review against the quality bar checklist in the repo.
3. Merge → CI rebuilds and redeploys the static site.

No CMS, no admin login — the workflow is "edit a file, open a PR".

## 7.3 Asset Plan

- Screenshots and diagrams: SVG where possible; otherwise AVIF/WebP, max 1600px wide, compressed, with descriptive `alt` text.
- One 1200×630 Open Graph image.
- Diagrams show real components; no generic filler.
- All assets committed to the repo under `public/`.

---

# 8. Website Structure

A single-page-with-anchors homepage for the skim layer, plus dedicated routes for depth.

```text
/                     Home
  #summary            Identity, areas, intro            (US-01)
  #looking-for        What I'm Looking For              (US-02)
  #skills             Grouped skills + context          (US-03, US-04)
  #projects           Selected project cards → link out (US-05)
  #problem-solving    Teasers → link to case studies    (US-07, US-08)
  #achievements       Timeline                          (US-09)
  #cv                 Download CV (PDF) + link to /cv    (US-10)
  #contact            Links + form + privacy line       (US-11)

/projects/<slug>      Full project case study           (US-05, US-06)
/problem-solving/<slug>  Full problem-solving case study (US-07, US-08)
/cv                   HTML version of the CV            (US-10)
/privacy              Privacy note                      (5.6)
/404                  Branded not-found with nav home
```

## 8.1 Progressive Disclosure

- **Layer 1 (homepage, above the fold):** everything a recruiter needs — identity, skills summary, "looking for", contact. No project needs to be opened.
- **Layer 2 (homepage sections + cards):** one-paragraph project and problem-solving summaries with a clear "Read the full case study" link.
- **Layer 3 (dedicated routes):** the full case studies, architecture, and the GitHub links.

## 8.2 Ordering Rationale

Skills before Projects because recruiters filter on skills first. Problem-Solving before Achievements because it is the strongest technical-depth signal for hiring managers. Contact is reachable from the sticky nav on every scroll position, not just the bottom.

## 8.3 Required States

Every page/section defines: loading (n/a for static, but fonts/images must not cause layout shift), **empty** (e.g. no live demo → hide the button, don't show a dead link), **error** (404 page), and **JS-disabled** (content and links still work).

## 8.4 Key Idea

The site is **not "my CV on a web page."**

| CV answers | Profile site answers |
|---|---|
| What have I done? | Who am I? What can I do? How do I think? How do I solve problems? What's the evidence? Why would I be valuable? |

---

# 9. Testing Strategy

Testing is prioritised by risk, not by category coverage. On a static site, the highest-value tests are the contact flow and the automated quality gates — not unit tests of presentational components.

## 9.1 Tooling

| Layer | Tool |
|---|---|
| Frontend unit / component | Vitest + React Testing Library |
| Backend unit | Go `testing` (table-driven) |
| End-to-end | Playwright |
| Accessibility | `axe-core` (via Playwright) |
| Performance | Lighthouse CI with the budgets in 5.1 |
| Links | Link checker over the built site |
| Static analysis | `tsc --noEmit`, ESLint, `go vet`, `golangci-lint` |

## 9.2 What Actually Gets Tested

**Backend (Go) — highest priority, aim ~90% coverage on the handler:**

- Valid submission → calls the mailer once, returns `200 {ok:true}`.
- Missing/invalid email, empty message, over-length fields → `400` with field errors.
- Honeypot filled or fill-time too short → rejected as spam (no mail sent).
- Rate limit exceeded → `429`.
- Mailer returns an error → `502 {error:"send_failed"}` and an alert is emitted.

**Frontend unit — only logic, not markup:**

- Content loaders parse `projects/*.md` front-matter correctly and fail loudly on a malformed file.
- Client-side form validation mirrors server rules.
- `ContactForm` renders success, error, and fallback states from given props.

**End-to-end (Playwright):**

1. Homepage renders identity, skills, and contact without JS errors; all Layer-1 content present in initial HTML.
2. Navigate homepage → a project case study → click through to GitHub (external nav asserted, then stopped).
3. Contact happy path with the email provider mocked → success message shown, form cleared.
4. Contact validation error → inline errors shown, no request sent.
5. Contact server failure (mock 502) → error message **and** `mailto:` fallback visible.

**Automated quality gates (fail the build):**

- Lighthouse CI budgets in 5.1 on `/` and one `/projects/<slug>`.
- `axe-core` scan on every route → zero serious/critical violations.
- Link checker → no broken internal links.

## 9.3 Manual Pre-Launch Checklist

- Keyboard-only pass of the whole site (nav, form, skip link).
- One screen-reader pass of the homepage and one case study.
- Visual check at 320px, 768px, 1440px.
- Real-device check on one iOS and one Android phone.
- Open Graph card preview validated with a card debugger.

## 9.4 CI

GitHub Actions on every pull request: install → lint + type-check + `go vet` → unit tests (frontend + Go) → build the static site → Lighthouse CI + axe + link check → Playwright E2E. All green is required to merge. Merge to `main` deploys.

---

# 10. Deployment & Operations

## 10.1 Frontend

- Built as a static / prerendered bundle and served from a CDN-backed static host (Vercel, Netlify, Cloudflare Pages, or S3 + CloudFront — chosen in Phase 0; the build output is standard so the host is swappable).
- Custom domain, HTTPS enforced, automatic deploy on merge to `main`, preview deploy per pull request.

## 10.2 Contact Service

- Deployed **separately** from the frontend as a single serverless function **or** a small Docker container.
- If containerised: **one process per container** — the frontend is not run in the same container.
- Environment variables: email-provider API key, allowed CORS origin, rate-limit config.

## 10.3 The Deprecated "single container running Next.js + Go" design is rejected

Running two long-lived processes in one container gives unclear restart, logging and supervision semantics and couples two independent failure domains. The frontend is static (no server process at all); the contact service stands alone.

## 10.4 Observability

- Platform request logs for both the static host and the contact service.
- An alert (email or chat webhook) on any `5xx` from the contact service, so a failed message is noticed.
- Cookieless analytics (Plausible, Fathom, or Cloudflare Web Analytics — chosen in Phase 0) for the 1.4 signals only.
- Uptime check pinging `/` and the contact health endpoint.

## 10.5 Optional: Go `embed`

If the contact service ever needs to ship small static assets (e.g. an email template), Go's standard-library `embed` package can bundle them into the binary. This is a minor convenience, not part of the core design.

---

# 11. Delivery Plan

Time-boxed, single maintainer. Each phase is shippable.

## Phase 0 — Foundations (before feature work)

Repo + CI skeleton; hosting and email provider chosen; custom domain; analytics chosen; design style note (type scale, colour tokens, spacing); layout shell (`Navbar`, `Footer`, page scaffold); `LICENSE`, `README` skeleton, `.env.example`.

## Phase 1 — MVP (must-have)

Home (all Layer-1 content), Skills, **3 full project case studies**, CV download + `/cv`, contact links + working form (with anti-spam, success/failure/fallback, privacy line), responsive, WCAG 2.1 AA, SEO basics, `/404`, `/privacy`. Deployed on HTTPS with CI quality gates enforced.

**Definition of done for Phase 1:** every MVP user story's acceptance criteria pass; Lighthouse ≥ 95; axe clean; keyboard and screen-reader passes done.

## Phase 2 — Should-have

"How I Solve Problems" with 2 case studies (incl. 1 failure/recovery story); Achievements timeline; architecture diagrams for ≥ 2 projects; project filtering by technology.

## Phase 3 — Nice-to-have

Dark mode; standalone linked Go project; additional projects; live demos; a static "notes" list; subtle motion (respecting `prefers-reduced-motion`).

---

# 12. Risks & Open Decisions

## 12.1 Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Content is the long pole; thin case studies undermine the whole site | High | Write 3 case studies to the quality bar **before** polishing UI (7.1) |
| Over-claiming seniority as a new graduate | High — damages credibility | Claims proportional to evidence; label personal/learning projects; honest achievement wording (4.5, 7.1) |
| Scope creep from "optional" features | Medium | Strict phase gating (Section 11); non-goals are explicit (3.3) |
| Single maintainer, limited time | Medium | Keep MVP small; each phase independently shippable |
| Email provider deliverability (messages land in spam) | Medium | Use a transactional provider with SPF/DKIM; test delivery; `mailto:` fallback always present |
| Contact endpoint abuse | Medium | Honeypot + fill-time + rate limit + length caps (5.5) |
| Host lock-in | Low | Standard static build output; `Mailer` interface abstracts the email provider |

## 12.2 Open Decisions (resolve in Phase 0)

- Static host: Vercel vs Netlify vs Cloudflare Pages vs S3+CloudFront.
- Contact service: serverless function vs small container, and where.
- Email provider: Resend vs Postmark vs SES.
- Analytics: Plausible vs Fathom vs Cloudflare Web Analytics.
- Domain name.
- Whether the standalone Go showcase project is in scope for this effort or tracked separately.
