---
name: finish-mi-task
description: Use at the END of every coding task in this repo to file the MI-{N} GitHub issue and commit the work under it. Required even for small changes. Triggers when work is "done" — before stopping, before committing.
---

# Finishing an MI Task

Every change to this site is tracked as one `MI-{N}` issue in `micode-ai/home`, and every commit
for it carries that number. When the work is done, do these in order:

1. Verify the work.
2. Create the `MI-{N}` issue.
3. Commit under it.

The issue stays **open**: it is closed only after the change is pushed and deployed (see the
end). Do not push unless you were asked to — a push to `development` deploys the site.

## Critical conventions

- **Everything on GitHub is in English** — issue title, body, commit messages — whatever the chat
  language. Reply to the user in their language as usual.
- **N is the highest `MI-N` in existing issue TITLES plus 1.** List closed issues too; the bare
  `gh issue list` hides them:
  ```bash
  gh issue list --state all --limit 400 --json title -q '.[].title' | grep -oE '^MI-[0-9]+' | sort -t- -k2 -n | tail -1
  ```
  Cross-check against recent commit subjects (`git log --oneline -10`).
- **Title**: `MI-{N} <short imperative summary>` — no colon after the number.
- **No attribution lines** in commits: no `Co-Authored-By`, no "Generated with".

## 1. Verify

```bash
npx vitest run
npx svelte-check
npx vite build
```

All tests pass and svelte-check reports 0 errors. Use `npx vite build`, NOT `npm run build`:
its `prebuild` fetches GitHub stars and npm downloads over the network and rewrites the tracked
`src/data/community-stats.json`, which would land an unrelated change in your commit.

## 2. Create the issue

Body shape — three sections, prose and bullets, no checklists:

```markdown
## Goal
<what was missing or wrong and for whom, 1-3 sentences; name the product idea / finding if
the task came from one>

## Scope
<what changed: files, components, i18n keys, key decisions; say plainly what is NOT visible
yet or not done>

## Verification
<what was run and the result: Vitest N/N, svelte-check 0 errors, build passes, anything
checked in the built site>
```

```bash
gh issue create --title "MI-{N} ..." --body "$(cat <<'EOF'
...
EOF
)"
```

## 3. Commit

- Subject: `MI-{N} <imperative summary>`. A task may span several commits; every one is
  prefixed with the same `MI-{N}`.
- Stage only the files of this task — never `git add -A` over someone else's work in the tree.
- No body is required; add one only when the why is not obvious from the subject and the issue.

## After deploy (not part of finishing)

Whoever pushes closes the issue once the deploy succeeded, with a comment naming the commits:
`Done: <sha>, <sha>, deployed.` Do not close it before that.

## Common mistakes

- Closing the issue right after committing — the change is not live yet.
- A title or commit without the `MI-{N}` prefix, or a checklist instead of Goal/Scope/Verification.
- `npm run build` for verification, dragging `community-stats.json` into the commit.
- A `Co-Authored-By` line in the commit message.
