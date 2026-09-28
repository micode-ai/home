# Learning note: vitest-test-author

## Role
Writes and fixes Vitest tests for Svelte components, services, stores, and data files in `micode-landing-page/`, following the project's `@testing-library/svelte` + `fast-check` conventions.

## Watchlist
- The agent's component skeleton always `import`s all three locale JSONs and calls `loadTranslations` in `beforeAll` — for a new component with no locale-sensitive text, watch that it doesn't cargo-cult this boilerplate in when the `Hero.test.ts` smoke-only pattern is the better fit.
- `fast-check` is currently only used in `src/services/validation.test.ts` and `src/services/i18n.test.ts` — if asked for "property-based tests" on a component (not a pure service), check whether that's actually the right tool before reaching for it.
- `analytics.ts` mutates `document`/`window` directly and is gated by cookie consent via `storage.ts` (per app-level `CLAUDE.md`) — any test touching `ContactForm` or `CookieBanner` needs the `vi.mock('../services/analytics', ...)` boundary mock the agent file specifies, not a real import.
- `vite.config.ts` is the real Vitest config (not `vitest.config.ts`, which only exists inside `node_modules/@braintree/sanitize-url` — a red herring if grepping the repo).
- Repo has both `vite.config.ts` and `vite.ssr.config.ts` (build uses both) — confirm which one vitest actually reads if a new test behaves differently under `test:run` vs `dev`.

## Clarifying question
When adding tests for a new component, should locale-switch coverage (`en`/`ru`/`pl`) be exhaustive per the agent's "full i18n-switch coverage is expected" rule, or is smoke-only acceptable if the component's copy is simple and already covered by an i18n-key parity check elsewhere (i18n-manager's job)?

## Agent file issues
None. Spot-checked package.json (vitest ^4.0.18, jsdom ^27.4.0, @testing-library/svelte ^5.3.1, fast-check ^4.5.3 — all match the "Stack" section), all five named test files (`Hero.test.ts`, `ProductPage.test.ts`, `ArticlePage.test.ts`, `BlogListing.test.ts`, `FounderProfile.test.ts`), all four named service files (`i18n.ts`, `storage.ts`, `analytics.ts`, `validation.ts`), and `src/setupTests.js` all exist as described. The "Open questions" section at the bottom already self-documents the one place the agent's example deviated from an earlier proposal (analytics gating), so no fresh evolution proposal is needed there.
