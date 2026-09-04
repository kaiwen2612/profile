# 0001 — Static build, no runtime content API

**Status:** accepted

**Context:** Profile content is small and changes rarely. Spec §6.1.

**Decision:** Compile all content (JSON + Markdown in the repo) into a static
Next.js export at build time. The only server is the Go contact endpoint.

**Consequences:** Fastest possible delivery, trivial hosting, strong SEO. Content
changes require a rebuild (acceptable — "edit a file, open a PR"). Go is showcased
by the contact service and, later, a separate standalone repo.
