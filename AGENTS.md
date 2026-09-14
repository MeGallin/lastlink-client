# LastLink client agent entry point

This repository is the React/TypeScript client for LastLink. The planning
workspace remains the source of truth for project decisions and handoff:
`C:\Users\garya\OneDrive\Documents\ChatGPT\TFL-journey visibilty\outputs\memory.md`.

## Working rules

- Keep increments small, mobile-first, accessible and easy to inspect in VS Code.
- The current screen checks arrival at a TfL station only. Do not add Darwin or
  National Rail dependencies without an explicit product decision.
- Submit explicit TfL StopPoint IDs for both locations, selected from the
  TfL-derived Tube station catalogue. Do not send free-form place text or
  invent/guess an identifier. Current-location coordinates and reverse
  geocoding require a separate privacy/location decision.
- Do not commit or push until the Product Owner has inspected the working tree,
  checks have passed, and the independent read-only code-review gate has passed.
- Never place credentials in source, Vite environment examples or committed
  files. `VITE_API_BASE_URL` is a URL only and does not contain a secret.
- Use native CSS in `src/App.css`. Do not add a CSS or component framework.
- The service worker may cache the app shell only. Never cache `/api` responses
  or evidence used for a journey decision.

## Commands

```sh
npm run dev
npm run lint
npm run build
npm run build:deploy
npm run check
```

`npm run build:deploy` creates the production Vite build and then runs
`scripts/deploy-to-xampp.cmd`, which mirrors `dist/` into the configured local
web root `C:\xampp\htdocs\WebSitesDesigns\live\lastlink`. The copy uses a
staging directory and a rollback-safe directory swap; files no longer present
in `dist/` are removed from that destination by design. If activation or
post-activation validation fails, the previous deployment is restored. The
previous version is retained as a rollback snapshot until the next deployment;
if that snapshot cannot be cleaned up, the live deployment is left untouched.
This is a Windows/XAMPP-only command.

The Vite development proxy sends `/api` requests to the owner-managed API at
`http://localhost:3000`. Set `VITE_API_BASE_URL` only when the API is hosted at
another origin or path.
