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
