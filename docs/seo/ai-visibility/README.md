# AI visibility

Does anything out there cite mi-code.pl when it answers a question? `REPORT.md`
holds the current answer; `runs/` holds one file per completed sweep.

## Automatic — daily, no hands

`.github/workflows/ai-visibility.yml` runs `npm run ai-visibility` every morning.
It asks Gemini the prompts in `prompts.json` with Google Search grounding and
reads back the sources it cited.

A full sweep is 27 prompts × 2 repeats = 54 calls, and the free tier allows **20
model calls a day** — the API is explicit about it:

```
id = GenerateRequestsPerDayPerProjectPerModel-FreeTier, value = 20
```

(The "up to 500 RPD" in Google's pricing table is the *search tool*, not the
model calls. That distinction cost us a design.)

So a sweep runs across three days. Each run measures the next slice of the work
list and saves its place in `partial.json`; only the run that takes the last
slice folds the sweep into `runs/YYYY-MM-DD.json`, rebuilds `REPORT.md`, and
compares against the previous sweep. Telegram hears about it only then, and only
if the set of cited prompts changed — a half-measured sweep is never compared
against a whole one.

## Manual — monthly, about ten minutes

Gemini is not ChatGPT, and there is no free API for the engines that matter most.
Once a month, fill in `manual/YYYY-MM.json` from `manual/TEMPLATE.json`:

1. **Cloudflare → Analytics → AI Crawlers.** Copy the hit counts per bot into
   `crawlers`. Read them in two groups: `GPTBot`, `ClaudeBot`, `CCBot` and
   `Google-Extended` are training and indexing, while `ChatGPT-User`,
   `OAI-SearchBot` and `PerplexityBot` fetch a page *while answering someone* —
   those are the footprint of an actual citation.
2. **GA4 → Traffic acquisition.** Copy sessions from `chatgpt.com`,
   `perplexity.ai` and the rest into `referrals`. Analytics only loads after a
   visitor accepts cookies, so this is a floor, never a total.
3. **The engines themselves.** Run the same prompts through a logged-in ChatGPT
   and Perplexity and record `{ engine, id, status }` rows in `engines`. Claude
   can drive this through the browser — ask it to run the monthly AI-visibility
   pass.

The next sweep to close picks the file up and folds it into `REPORT.md`.

Once the month's file is committed and pushed, send it to the ops channel:

    gh workflow run "AI visibility manual" -f month=2026-08

There is no schedule — the pass is hand-driven, so the report goes out when the
pass is done. Record `citedDomains` (ours) and `sourceDomains` (all) per entry:
without them only two of the five advice rules can fire.

## Changing the prompts

Edit `prompts.json`. A new product or article usually deserves one category
prompt phrased the way a customer who has never heard of us would ask it.
`scripts/ai-visibility/prompts.test.mjs` guards the shape; run `npm run test:run`
after editing.

Editing the set abandons the sweep in progress and starts a new one from zero.
That is intended: the cursor in `partial.json` is an index into a work list built
from `prompts.json`, and a sweep measured against two different prompt lists
would be meaningless — some prompts counted twice, the new ones never asked at
all. `partial.json` carries a fingerprint of the list so the next run notices and
says so in its log. There is no need to wait for a safe window; there isn't one.

Keep the brand prompts. They are the canary: if even "what does MiCode do" stops
finding us, indexing broke, and no amount of content will fix that.
