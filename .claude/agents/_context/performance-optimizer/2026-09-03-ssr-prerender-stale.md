---
agent: performance-optimizer
title: 'Update client-rendered assumption now that build has a real prerender/SSR step'
status: proposed
conflict: false
created_at: 2026-09-03
---

## What's wrong
The agent's "Don't" section instructs: "Don't break SSR/SSG assumptions — this app is fully client-rendered, so module-level side effects run on every visitor; gate them carefully." This sentence contradicts itself (it warns about SSR/SSG in the same breath as declaring the app fully client-rendered) and it no longer matches the repo. `micode-landing-page/package.json`'s `build` script is `vite build && vite build --config vite.ssr.config.ts && node scripts/prerender.mjs` — there is a dedicated SSR build config (`vite.ssr.config.ts`) and a prerender script (`scripts/prerender.mjs`) that produces static output per locale (`/en/`, `/ru/`), per the project's separately tracked "Locale prerender" work completed 2026-07-06. An agent following the current instruction could reason incorrectly about where module-level side effects execute (e.g. assume `window`/`document` is always available at import time, or measure performance only against the client bundle and ignore the prerendered HTML).

## Proposed change
- Replace the contradictory sentence with an accurate one, e.g.: "This app now ships a prerendered/SSR build (`vite.ssr.config.ts`, `scripts/prerender.mjs`) in addition to the client bundle — module-level side effects run in both the Node-based prerender pass and in-browser, so guard any `window`/`document`/browser-API access at module scope."
- Add a short pointer under "Known levers" (or a new numbered section) noting that Lighthouse/LCP measurements should be taken against the prerendered HTML output, not just the client-side dev/preview build, since that's what real visitors and crawlers see first.
- Cross-reference the SSR/prerender scripts by name (`vite.ssr.config.ts`, `scripts/prerender.mjs`) so future agent runs know where to look before assuming full CSR.

## Rationale
Today, an agent invoked for a performance task could either (a) misapply the "fully client-rendered" assumption and skip checking prerender-time side effects, causing a build break that only shows up in the prerender step, or (b) benchmark performance against the wrong artifact (client bundle only) and report misleading before/after numbers. Fixing the sentence and adding the SSR-aware measurement note keeps the agent's guidance aligned with the actual build pipeline and prevents both failure modes.
