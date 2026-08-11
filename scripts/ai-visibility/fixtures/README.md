# Fixtures

`generate-content.json` and `interactions.json` pin the two response shapes the
Gemini API can return for a grounded prompt. One of them was captured live on
2026-08-11 with a real key; the other is hand-written to lock the shape.

Recorded on capture:

- Endpoint that answered: `generateContent`
- Citation URLs came back as: `vertexaisearch redirects`
- `web.domain` present: `no`

Each chunk's `title` is the bare publisher domain (for example `krs-online.com.pl` and `eksiegowyai.pl`), and it matches the host the redirect actually resolves to. A later task relies on this to avoid a HEAD request per source.

`run.mjs` defaults to the endpoint recorded above (`DEFAULT_MODE`). The other is
reachable via `AI_VIS_ENDPOINT`, so a future migration is a config change rather
than a rewrite.

Fixtures contain no API key. Refresh them by re-running the probe in
`docs/superpowers/plans/2026-08-11-ai-visibility-checker.md`, Task 1.
