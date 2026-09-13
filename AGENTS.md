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
npm run check
```

The Vite development proxy sends `/api` requests to the owner-managed API at
`http://localhost:3000`. Set `VITE_API_BASE_URL` only when the API is hosted at
another origin or path.
