---
title: "Family Expenses Tracker"
slug: family-expenses-tracker
summary: "A multi-tenant Go web app for a family to track shared expenses: receipt-photo capture with LLM-assisted extraction, credit-card statement upload with reconciliation, and a spending dashboard, with every family's data isolated by both application logic and PostgreSQL Row-Level Security."
technologies:
  - name: "Go, chi & pgx"
    why: "The backend: chi for HTTP routing and a middleware chain (request ID, structured logging, panic recovery, session loading, CSRF), pgx as the Postgres driver, with SQL kept in a repository layer below the handlers and services."
  - name: "PostgreSQL & golang-migrate"
    why: "Relational storage with versioned, checked-in schema migrations. Money is stored as integer minor units, never floating point."
  - name: "Google OIDC (go-oidc, go-jose, oauth2)"
    why: "Sign-in via the Authorization Code flow with PKCE, with the Go server as a confidential OAuth client and server-side, cookie-addressed sessions rather than tokens in the browser."
  - name: "Anthropic Claude (vision & forced tool calls)"
    why: "Extracts structured fields (amount, date, merchant, suggested type) from a photographed receipt in one multimodal call, and turns a parsed statement's text into a strict JSON schema."
  - name: "LlamaParse"
    why: "Converts a multi-page PDF credit-card statement (and HEIC receipts, which Anthropic's vision endpoint rejects) into markdown ahead of the LLM extraction step, since a document-layout parser handles a statement's tables better than feeding a model raw PDF text."
decisions:
  - decision: "Built the frontend as server-rendered HTML from Go's html/template, with a little vanilla JavaScript on only two pages for progressive enhancement, instead of a single-page app. That choice also simplified authentication: the Go server is a confidential OAuth client holding a real client secret, and the browser only ever gets an opaque session cookie, never an access or ID token to store and refresh."
    rejectedAlternative: "A JavaScript SPA frontend. It would have to hold and refresh OAuth tokens in the browser as a public client, which is harder to secure, and would add a separate API and build step the assignment's actual interaction (photograph a receipt, review the extracted fields, confirm) didn't need."
  - decision: "Enforced tenant isolation twice, independently. Every repository query takes family_id from the server-side session only, never from request input. PostgreSQL Row-Level Security policies enforce the same boundary again at the database layer via a per-transaction SET LOCAL app.family_id, backed by automated tests that assert a user in one family gets 404/403 on every other family's resource."
    rejectedAlternative: "Relying on application-level scoping alone. One missed WHERE family_id = ... in a single repository method would leak another family's expenses; Row-Level Security makes that failure mode structurally impossible rather than something code review has to catch every time."
result: "The system is fully implemented end-to-end against the proposed design: Google sign-in, first-login family provisioning by invite code, manual and receipt-photo expense entry, credit-card statement upload with administrator-reviewed reconciliation, a spending dashboard, and family/role management. A seeded demo family (\"Tan Household\", invite code DEMO-0001) and a make setup target bring the whole thing up locally with one command. The test suite includes plain unit tests plus database-backed repository and tenant-isolation tests, and a separate cmd/verify-statement tool that re-derives a statement's ground truth straight from the PDF text with no LLM involved, specifically to catch a schema-valid but hallucinated transaction amount."
learned: "The hardest part of the LLM extraction pipeline wasn't getting a model to return valid JSON, forced tool-calls handled that easily. The real difficulty was constraining it to be correct for my specific data: early on, the model would confidently return a plausible category like \"Restaurant\" when my family's actual list only had \"Dining,\" silently falling back to \"Other\" every time. Fixing that meant passing the family's real expense-type names into the schema as an enum before every call, not just hoping the prompt was clear enough. HEIC photos taught a similar lesson: Anthropic's vision endpoint flatly rejects the iPhone's default photo format, so those uploads had to route through an entirely separate document-parsing path. If I rebuilt the tenancy layer today, I'd enforce from day one that the app's database role can never have BYPASSRLS, locally, a single unrestricted role left Row-Level Security policies technically present but never actually exercised, exactly the kind of gap that looks fine until it isn't."
order: 5
---

**Family Expenses Tracker** is a Go backend assignment: a mobile-first, multi-tenant web application for a family to log and reconcile shared spending, built from a proposed-technical-approach document through to a working implementation.

## Problem

The assignment brief asked for a system demonstrating authentication, authorization, multi-tenancy, relational modelling, AI-assisted extraction, document processing, reconciliation, and secure backend design, specifically for a family tracking shared expenses: manual entry, receipt-photo capture, a searchable expense list, a spending dashboard, credit-card statement reconciliation, and family/role management, with Go and PostgreSQL as required constraints and money represented as an integer.

## Approach

A family signs in through Google. On first login they either create a family (becoming its administrator) or join one with an invite code, and from then on every request resolves the user's family and role from their session, never from anything the client sends. Members add expenses manually or by photographing a receipt, which the backend sends to a vision model for structured extraction; the result is always shown for review and correction before it's saved, so the model never writes to the database unsupervised. Administrators can also upload a credit-card statement PDF, which runs through a separate parsing pipeline and is matched against existing expenses for manual, per-transaction reconciliation review.

## Technical decisions

The frontend choice (server-rendered `html/template`, not a single-page app) was made jointly with the authentication design: because the Go server itself is the confidential OAuth client, the browser only ever holds an opaque session cookie, not an OAuth token it would otherwise need to store and refresh.

Tenant isolation was treated as something worth enforcing twice. Every tenant-owned table carries a `family_id` column, and the repository layer takes that value from the authenticated session, never from request input, so there is no code path where a client could ask for another family's data. On top of that, PostgreSQL Row-Level Security policies enforce the same boundary again inside the database via a per-transaction `SET LOCAL app.family_id`, so a single missed `WHERE family_id = ...` in application code fails closed instead of leaking data, and an automated test suite explicitly checks that a Family A user gets `404`/`403` on every Family B resource.

A third decision shaped the extraction pipeline itself: a receipt is a simple, single-page image, so JPEG/PNG photos go straight to one vision-model call, while HEIC photos (which Anthropic's vision endpoint rejects outright) and multi-page statement PDFs are routed through LlamaParse first to get a document-layout-aware markdown conversion before a forced-tool-call extraction step. The model's `suggested_type` field is constrained by a JSON-schema enum to the family's actual expense-type names, fetched before the call, so a plausible-but-wrong guess fails validation and falls back to "Other" instead of silently mislabelling an expense.

## Implementation

The backend is layered `handler → service/repository` per feature package under `internal/` (`accounts`, `expenses`, `expensetypes`, `receipts`, `statements`, `reconciliation`, `dashboard`, `families`, `users`, `audit`, `auth`), with shared HTTP and template scaffolding in `internal/server` and `internal/webui`. Money is stored as `BIGINT` minor units with an ISO 4217 currency code, never a float. Statement parsing is a two-stage pipeline: LlamaParse turns the uploaded PDF into markdown, then a forced-tool-call request against the Anthropic Messages API turns that markdown into the strict transaction schema the reconciliation logic expects. Reconciliation itself only ever proposes matches, possible matches, and mismatches; turning an unmatched statement transaction into a new expense stays a manual, per-transaction action an administrator explicitly triggers, never a bulk or automatic step, since a parser misreading one field shouldn't be able to pollute the family's expense history unsupervised.

## Testing

`go test ./...` runs the plain unit tests (extraction validation, the reconciliation matching logic, money formatting) with no setup. Tests that need a real database, including the repository and tenant-isolation tests, check for a `TEST_DATABASE_URL` and skip themselves if it isn't set, so the full suite runs against a disposable Postgres database. Separately, `cmd/verify-statement` is a standalone audit tool, deliberately independent of the app's own LLM-based extraction: it re-derives a stored statement's ground truth straight from the PDF text via `pdftotext`, with no LLM involved, and checks that every stored transaction is actually traceable back to a line in the source document, specifically to catch a schema-valid but hallucinated amount that the extraction step's own validation couldn't.

## Results

The system runs end-to-end: Google sign-in, first-login provisioning into a family by invite code, manual and receipt-photo expense entry with human-reviewed LLM extraction, credit-card statement upload with administrator-reviewed reconciliation, a spending dashboard, and family/role management, all brought up locally with one `make setup` command against a seeded demo family and a fixed invite code. The design doc's own discussion points (one family per user, self-service family creation, reconciliation as suggest-only, no mandated extraction provider, local-only deployment for grading, per-expense currency without full FX conversion) were each decided explicitly before implementation rather than left ambiguous, and the built system follows them.

## What I learned

The hardest part of the LLM extraction pipeline wasn't getting a model to return valid JSON — forced tool-calls handled that easily. The real difficulty was constraining it to be correct for my specific data: early on, the model would confidently return a plausible category like "Restaurant" when my family's actual list only had "Dining," silently falling back to "Other" every time. Fixing that meant passing the family's real expense-type names into the schema as an enum before every call, not just hoping the prompt was clear enough. HEIC photos taught a similar lesson: Anthropic's vision endpoint flatly rejects the iPhone's default photo format, so those uploads had to route through an entirely separate document-parsing path.

If I rebuilt the tenancy layer today, I'd enforce from day one that the app's database role can never have `BYPASSRLS` — locally, a single unrestricted role left Row-Level Security policies technically present but never actually exercised, exactly the kind of gap that looks fine until it isn't.
