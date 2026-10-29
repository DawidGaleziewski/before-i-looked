# rig

The lane's resident service: keeps a heartbeat, serves the status board, reads the night's run
log. Hono + JSX, rendered on the server, Node 22+.

Read first: `docs/vision.md`, `docs/styleguide.md`. Decisions: `docs/adr/`.

## Commands

- `pnpm dev` / `pnpm start`: serves on `PORT` (8787). Needs `.env` (copy `.env.example`).
- `pnpm test`: vitest. `pnpm typecheck`: tsc.

## How work moves here

1. A feature starts as a plan: `plan.md` at the root (one at a time). Finished plans live in
   `docs/plans/done/`.
2. The plan is split into GitHub issues: skill `plan-to-issues` (`.agents/skills/`). A human
   reviews the split before anything is published. GitHub issues out of reach: files in
   `docs/issues/` (ADR 0004).
3. Issues are worked by workers, one issue per worker, each on its own branch or worktree.
   Pick the model per issue: the strongest for logic, a cheaper one for views and tests.
4. A worker closes its issue with a closing comment, exactly this shape:

   ```
   done: <what changed, one line>
   worker: <harness> · <model> · <effort>
   commit: <sha or "none">
   ```

5. An issue is closed only when its "Done when" holds. If it can't hold yet, leave it open and
   say what it waits on.

## What every issue carries

Split from `plan.md` with the skill `plan-to-issues`, in dependency order, so `Blocked by` cites real numbers. The human reviews the split first. Every issue has the label `plan:<plan name>` (this is how the reviewer sorts them) and this body:

```
Source: plan.md § <n>

<scope: what to build, the rules from the plan that apply>

**Done when:** <one checkable condition from the plan>

**Blocked by:** #<n>, #<n>  (or "nothing")

**Suggested worker:** <strongest model for logic | cheaper model is fine | coordinator, needs the owner's yes>
```

- One issue per unit of work. A step that waits on someone else (a review) or needs the owner's yes is its own issue and blocks the clean-up.
- Close with the comment above. GitHub closes an issue by itself when a commit on the default branch says `closes #n`, so post the comment anyway.

## Previews

A preview is one static HTML file made by a command (`pnpm digest:save` writes `previews/`, which is git-ignored), put on a public HTTPS host you can upload over. Never commit it. Keep the lane marker on it until the reviewer has seen it; then save the page again with `LANE_MARKER` unset, upload it over the same link, and say so on the issue (ADR 0003).

## Skills

Shared skills live in `.agents/skills/`, one folder each, `SKILL.md` inside. That folder is the
one source for every harness on the team. If yours loads skills from somewhere else, point it
here (a link or a config entry). Don't copy: copies drift.

## Rules

- Never commit `.env`, tokens or previews.
- Don't touch `runs/`: those are real nights, read-only fixtures.
- No client JS (ADR 0001).
