# Personal Profile Site — Specification

**Project:** Personal Professional Profile Site
**Purpose:** Give recruiters and hiring managers concrete evidence of what I can do and how I work — evidence that does not fit in a CV.
**Status:** Draft v3 (simplified)

---

## Contents

1. Problem & Goals
2. Audience
3. Scope
4. Pages & Content
5. Design & Quality
6. Tech Stack
7. Content Plan
8. Launch Checklist
9. Later Ideas

---

# 1. Problem & Goals

My CV lists what I've done (*"Python — Machine Learning — AWS — Go"*) but not how I've used it, how I think through a problem, or what I'd bring to a team. This site fills that gap — it's evidence, not a repeat of the CV.

The site should move a visitor from:

> **"Who is this candidate?"** → **"I understand what they can do."** → **"I'd like to talk to them."**

**Goals:**

- Present my professional identity clearly, above the fold.
- Show my skills grouped by category, with real context — not a list of buzzwords.
- Show 3 real projects in enough depth to prove I built them and understand them.
- Make it easy to download my CV and to contact me.
- Work well on phone, tablet and desktop.
- Look clean and professional — content first, no unnecessary flash.

Quality over feature count. A handful of things done well beats a long feature list.

---

# 2. Audience

Two kinds of visitor, both served from the same pages:

**Recruiters** — skim in under a minute. They want: who I am, what I studied, what roles I want, my main skills, how to contact me. All of this should be visible on the homepage without opening anything.

**Hiring managers** — go deeper into one or two projects. They want: what I actually built, what technologies I used and why, what problems came up, how I solved them, and whether I can explain my decisions. This is what the project pages are for.

---

# 3. Scope

**In scope (v1):**

- Homepage: intro, what I'm looking for, skills, project list, CV download, contact.
- 3 project pages with real detail (problem, approach, decisions, result, what I learned).
- Contact via email / LinkedIn / GitHub links (working `mailto:` and profile links).
- Responsive layout, reasonably fast, reasonably accessible.
- Deployed and publicly reachable over HTTPS.

**Nice to have, later, not blocking v1:**

- A "how I solve problems" section with a couple of short write-ups.
- An achievements/timeline section (certifications, awards, etc.).
- Dark mode.

**Not doing:**

- Any database, CMS, or admin login — content is just files in the repo, edited directly.
- User accounts, comments, or a blog engine.
- A contact form. Email (`mailto:`), LinkedIn and GitHub links cover this better than a form would: no third-party form service, no success/error states to build, no "where does this data go" question, and no `mailto:`-doesn't-work failure mode since LinkedIn is a no-client-needed fallback. A custom backend service is correspondingly unnecessary too — this is a static site with no server-side logic at all.
- Heavy analytics — a simple, privacy-friendly pageview counter is optional, not required.
- Multiple languages.

---

# 4. Pages & Content

## Homepage (single page, anchor sections)

- **Intro** — name, one line of professional identity (e.g. *"Software Engineering · AI/ML · Data · Cloud"*), a one-to-two sentence summary. This is the only `<h1>` on the page.
- **What I'm looking for** — role types, areas of interest, location/remote preference. A sentence or two.
- **Skills** — grouped by category (e.g. Languages, AI/ML, Cloud, Web & Tooling), each group with one line of real context (*"Go — used to build REST APIs and CLI tools"*). No skill-percentage bars — they're not meaningful.
- **Projects** — a card per project: name, one-line summary, main technologies, link to the full project page. If a project has a live demo or GitHub repo, link it; otherwise leave those links out rather than showing a dead one.
- **CV** — a clearly visible "Download CV (PDF)" button.
- **Contact** — email (`mailto:` link), LinkedIn, GitHub. No contact form (see §3).

## Project pages (`/projects/<slug>`)

Each of the 3 launch projects gets its own page with:

- What the project is and the problem it solves.
- The technologies used, and *why* each was chosen (not just a list of names).
- One or two real technical decisions — what I chose and what the alternative would have been.
- The result, ideally with a number (e.g. "cut processing time from 90s to 12s").
- What I learned or would do differently.
- Link to the GitHub repo and/or a live demo, where they exist.

Roughly 300–600 words is enough — long enough to show real depth, short enough that someone will actually read it.

## Other pages

- **`/404`** — a simple not-found page with a link back home.

That's the whole site map. No CMS admin, no dashboards, no user-facing search.

---

# 5. Design & Quality

Keep this practical, not a checklist to automate:

- **Responsive** — should look right on a phone (~375px wide) and a laptop. Check it in the browser's device toolbar before launch.
- **Accessible** — real link/button text (not "click here"), labels on any form fields, decent colour contrast, images have `alt` text, the page works with the keyboard alone. Run the browser's built-in accessibility check (e.g. Chrome DevTools → Lighthouse) before launch as a sanity check.
- **Fast** — this is a static site with a handful of pages; it should load quickly by default. Compress images, don't add heavy third-party scripts.
- **SEO basics** — a real page title and description, and one Open Graph preview image so the link looks right when shared on LinkedIn.

No enforced performance budgets, CI pipelines, or automated test suites are required to ship this. If the project grows later and that becomes worth the overhead, revisit it then.

---

# 6. Tech Stack

Keep it to one stack, one deploy target:

| Area | Choice |
|---|---|
| Framework | Next.js (or a plain static site if that's simpler) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Content | Markdown/JSON files committed to the repo — no database, no CMS |
| Hosting | Google Cloud — Firebase Hosting (static-site hosting, automatic HTTPS/CDN, `firebase deploy`), custom domain optional |

**No separate backend service for this site.** If I want to showcase Go or another backend language, that's a separate, standalone project with its own repo, linked from here — it should not become infrastructure this site depends on to work.

Version control: a public GitHub repo with a README covering what the project is, how to run it locally, and how to deploy it.

---

# 7. Content Plan

The content is what makes this site worth visiting — writing it matters more than the design.

- Pick 3 real projects (or solid personal/coursework projects, honestly labelled as such).
- For each: write the problem, what was tried, what was decided and why, the result, and what I learned. Use real numbers where I have them.
- Don't inflate personal or learning projects to sound like production work — say what they actually were.
- Write the 3 project write-ups *before* spending time polishing the visual design. If I can't write 3 decent ones, the site isn't ready yet.

---

# 8. Launch Checklist

Before sharing the link:

- [ ] All 3 project pages have real content (no placeholder text left in).
- [ ] CV PDF is up to date and the download link works.
- [ ] Contact links (email/LinkedIn/GitHub) all work.
- [ ] Site looks right on mobile and desktop.
- [ ] No obviously broken links or images.
- [ ] Page title, description and the Open Graph preview image look right when the link is shared.
- [ ] A quick pass with the browser's Lighthouse/accessibility check — fix anything glaring.

That's it — no separate deployment runbook, no multi-service checklist.

---

# 9. Later Ideas

Not needed for v1, worth considering only if the site is getting real use and it's still fun to work on:

- A "how I solve problems" section with one or two short write-ups, including something that didn't work first time.
- An achievements/timeline section.
- Dark mode.
- More projects.
- A standalone Go (or other) project, built and shown separately, linked from the homepage.
