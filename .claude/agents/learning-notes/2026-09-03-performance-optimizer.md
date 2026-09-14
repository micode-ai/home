# Learning note: performance-optimizer

## Role
Investigates and improves runtime/load performance of the Micode landing page — bundle size, images, fonts, third-party scripts, CSS, and animations — with a measure-before-and-after workflow.

## Watchlist
- **EmailJS is still statically imported.** `src/components/ContactForm.svelte:3` has `import emailjs from '@emailjs/browser'` at the top level, not the dynamic `import()` inside `handleSubmit()` the agent file prescribes. This is still an open, actionable win exactly as described — confirm before claiming it's already done.
- **The build now has a real SSR/prerender step.** `package.json`'s `build` script is `vite build && vite build --config vite.ssr.config.ts && node scripts/prerender.mjs`. This contradicts the agent's blanket "this app is fully client-rendered" framing (see Agent file issues below) — check `scripts/prerender.mjs` and `vite.ssr.config.ts` before assuming module-level side effects only ever run in-browser.
- `OptimizedImage.svelte` and `LazyImage.svelte` both exist as claimed at `src/components/` — verify any new image usage actually goes through them rather than raw `<img>`.
- `vite` is pinned via `overrides` to `npm:rolldown-vite@7.2.5` — confirm this override survives before doing bundle-analysis work that assumes rolldown-specific behavior (source maps, chunking).
- `services/analytics.ts` and `services/mktai.ts` are imported at the top of `App.svelte` (`initializeAnalytics`, `initializeMktai`) — didn't have budget to confirm the cookie-consent gating actually defers execution; worth checking the call sites, not just the imports, before verifying "no analytics on first paint."

## Clarifying question
Given the SSR/prerender build step now exists, should performance targets (LCP, Lighthouse) be measured against the prerendered HTML output or the client-hydrated bundle — and does prerendering change which chunk is actually "critical path" for LCP?

## Agent file issues
- The "Don't" section says "Don't break SSR/SSG assumptions — this app is fully client-rendered" — this is internally contradictory (mentions SSR/SSG then asserts it's fully client-rendered) and is now factually stale: `package.json` runs a dedicated `vite build --config vite.ssr.config.ts` plus `node scripts/prerender.mjs`, i.e. there is a real prerender/SSR output, matching the separately-tracked locale-prerender work (`/en/`, `/ru/` prerendering shipped 2026-07-06). See evolution proposal `2026-09-03-ssr-prerender-stale.md`.
