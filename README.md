# Personal Profile Site

A small static profile site. See `profile-site-specifications.md` for what it is and why.

## Local development

    pnpm install
    pnpm dev

## Build

    pnpm build

Static output goes to `out/`.

## Deploy (GitHub Pages)

Deployment is automatic. The workflow in `.github/workflows/deploy.yml` builds the
static export and publishes it to GitHub Pages on every push to `main`.

One-time setup (already done for this repo):

1. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Custom domain `kwen.dev` is set via `public/CNAME`. Point the domain's DNS at
   GitHub Pages (four `A` records for the apex, or a `CNAME` record for `www`) —
   see GitHub's "Managing a custom domain" docs.

To deploy manually without a push, run the workflow from the repo's **Actions** tab
("Deploy to GitHub Pages" → "Run workflow").

## Content

Edit the files under `content/` and the 3 files under `content/projects/` directly, then rebuild and redeploy. There's no CMS or admin UI — this is intentional.

**Before sharing the link:** replace the placeholder text in `content/profile.json`, `content/skills.json`'s group contexts if you change them, all 3 `content/projects/*.md` files, and `public/cv.pdf` (currently a placeholder PDF) with your real content — see the Launch Checklist in `profile-site-specifications.md`.
