<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Troubleshooting Documentation Protocol
Whenever we encounter and successfully resolve an error (frontend, backend, or deployment), you MUST automatically append a new troubleshooting entry to either:
- `project-docs/troubleshooting-frontend.md`
- `project-docs/troubleshooting-backend.md`

Use the standard PM format: Symptom, Root Cause, Diagnosis, and Solution (with code snippets).
