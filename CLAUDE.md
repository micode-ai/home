# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run dev` — start Vite dev server
- `npm run build` — runs `prebuild` (fetches GitHub stars / npm downloads into `src/data/community-stats.json`) then `vite build`, emitting all multi-page entries to `dist/`
- `npm run preview` — preview the production build
- `npm test` / `npm run test:run` — Vitest in watch / single-run mode
- `npm run test:ui` — Vitest with the UI runner
- Run a single test file: `npx vitest run src/components/ProductPage.test.ts`
- Run tests matching a name: `npx vitest run -t "renders Polish UI chrome"`
- There is no separate lint script; `tsconfig.json` is `noEmit` — use `npx svelte-check` for type/template checking if needed.

## Architecture

This is a **Svelte 5 + Vite multi-page static site** (no SvelteKit, no Astro, no client-side router). Each "page" of the site is its own Vite build entry with its own `index.html` + `main.ts` that mounts a root Svelte component via `mount()`. All entries are registered in `vite.config.ts` under `build.rollupOptions.input` — adding a new page means adding both the HTML/TS files and a new entry there.

Entry points:
- `index.html` / `src/main.ts` → `App.svelte` — the main landing page (Hero, Services, Products, Contact, etc.)
- `products/<product-id>/index.html` + `main.ts` → `ProductApp.svelte` → `ProductPage.svelte`, parameterized by a **hardcoded `productId` prop** in each product's `main.ts` (e.g. `products/accounting-ai/main.ts` passes `productId: 'accounting-ai'`)
- `blog/index.html` → `BlogApp.svelte` → `BlogListing.svelte` (lists posts from `src/data/blog-posts.json`)
- `blog/<slug>/index.html` + `main.ts` → `ArticleApp.svelte` → `ArticlePage.svelte`, parameterized by a **hardcoded `slug` prop** in that article's `main.ts`

Since there's no router, every new product or blog article requires: a new directory under `products/` or `blog/` with its own `index.html` + `main.ts`, plus a matching `rollupOptions.input` entry in `vite.config.ts`.

**For a blog article, do not do those four steps by hand — run `node scripts/add-blog-post.mjs <payload.json>`** (`--dry-run` to check first). It appends the entry, writes `index.html` + `main.ts`, and inserts the `vite.config.ts` input, refusing the whole payload if anything is off. The reason it exists: `src/data/blog-posts.json` is ~780 KB — 17 articles with three full language bodies each — and reading it to append an entry exhausts an agent's context before it writes anything. Do not open that file to edit it; sample one entry if you need the shape.

### Content/data-driven pages, not hardcoded markup

- `src/data/products.json` is the source of truth for all product pages — `ProductPage.svelte` looks up the product by `id` and renders generically. Adding a product = adding a JSON entry (+ i18n keys + optional image/diagram), not new markup.
- `src/data/blog-posts.json` drives `BlogListing.svelte` and `ArticlePage.svelte` similarly (slug, per-language title/summary, date, tags).
- `src/data/langgraph-diagrams.ts` holds Mermaid diagram definitions keyed by id; a product opts in via `langgraphDiagramId` in `products.json` and they render through `MermaidDiagram.svelte` (lazy-loads the `mermaid` package via dynamic import, calls `mermaid.run()`).
- `src/data/community-stats.json` is **generated**, not hand-edited — it's overwritten by `npm run prebuild` (`scripts/fetch-github-npm-stats.js`), which reads GitHub/npm links out of `products.json` and fetches star/download counts at build time.

### i18n

Three languages: `pl` (default), `en`, `ru`. Translation dictionaries live in `src/data/{pl,en,ru}.json` and are loaded once per page via `loadTranslations()` in `src/services/i18n.ts`. Lookups use dot-notation keys through `t(key, lang)` (e.g. `t('product.about', $languageStore)`); an unresolved key returns the key itself rather than throwing. Current language is a Svelte store, `languageStore` (`src/stores/languageStore.ts`), persisted to `localStorage` under `micode_language`, defaulting to `pl`. `products.json`/`blog-posts.json` entries reference translation keys (e.g. `nameKey`, `descriptionKey`) rather than embedding text directly — except blog posts, which embed all three languages inline as `titlePl`/`titleEn`/`titleRu` etc.

### Other cross-cutting pieces

- `src/services/analytics.ts` and `src/services/mktai.ts` are only initialized in `onMount` and only if `getItem('cookieConsent') === 'accepted'` (via `src/services/storage.ts`, a `localStorage` wrapper) — cookie-consent gating is intentional, don't initialize these eagerly.
- `src/stores/darkModeStore.ts` persists dark mode under the `a11y-settings` localStorage key (shared with other accessibility toggles) and toggles a `dark-mode-active` class on `document.documentElement`.
- `src/components/SEO.svelte` injects per-language meta tags and JSON-LD structured data (`Organization` schema) for the main landing page; product/article pages do their own meta handling inline.
- Every top-level app component (`App`, `ProductApp`, `BlogApp`, `ArticleApp`) independently wires up `Header`, `Footer`, `CookieBanner`, `PrivacyPolicyModal`, and i18n/analytics bootstrapping — there's no shared layout component, so changes to that chrome must be replicated across all four.
- `.env` / `.env.example` define `VITE_EMAILJS_*` (contact form, via `@emailjs/browser`), `VITE_GA_MEASUREMENT_ID`, and `VITE_MKTAI_*` (emarketingai.pl tracking script).
- Deploy: GitHub Actions (`.github/workflows/deploy.yml`) builds on push to `development` and publishes `dist/` to GitHub Pages.

### Testing

Vitest + `@testing-library/svelte` + `jsdom`, configured in `vite.config.ts` (`test.setupFiles: ./src/setupTests.js`). Co-located `*.test.ts` files next to the component/service they cover (e.g. `src/components/ProductPage.test.ts`, `src/services/i18n.test.ts`). Component tests typically call `loadTranslations()` with all three locale JSON files in `beforeAll` and set `languageStore` per-test to assert rendered i18n text directly.
