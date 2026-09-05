# Personal Profile Site

A small static profile site. See `profile-site-specifications.md` for what it is and why.

## Local development

    pnpm install
    pnpm dev

## Build

    pnpm build

Static output goes to `out/`.

## Deploy (Google Cloud — Firebase Hosting)

1. Install the Firebase CLI if you don't have it: `npm install -g firebase-tools`
2. `firebase login`
3. Create a Firebase project (console.firebase.google.com) or use an existing Google Cloud project, and put its project ID in `.firebaserc`.
4. `pnpm build`
5. `firebase deploy --only hosting`

## Content

Edit the files under `content/` and the 3 files under `content/projects/` directly, then rebuild and redeploy. There's no CMS or admin UI — this is intentional.

**Before sharing the link:** replace the placeholder text in `content/profile.json`, `content/skills.json`'s group contexts if you change them, all 3 `content/projects/*.md` files, and `public/cv.pdf` (currently a placeholder PDF) with your real content — see the Launch Checklist in `profile-site-specifications.md`.
