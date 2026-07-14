## Bakobo engineering standards

How every Bakobo repo builds is governed by cross-cutting standards, canonical in the sibling
[`bakobo/dev`](../dev) repo. If `../dev` is not checked out beside this one, clone it before design
work: `git clone --depth 1 https://github.com/bakobo/dev`. Always on:

- **Intent-first** development and **strict TDD at 100% branch coverage of new code** — see the
  sections below and [`dev/methodology.md`](../dev/methodology.md).
- **Fail closed.** Untrusted input never carries authority; when something can't be checked, the
  effect does not land ([`org` principle 8](../org/design/purpose-and-principles.md)).
- **High-quality errors.** Every error carries a stable symbolic code, says whether retrying could
  help (permanent vs. transient), and reads as complete, plain sentences in the house voice — never
  "something went wrong." Full standard: [`dev/standards/error-handling.md`](../dev/standards/error-handling.md).
- **Tasks and tech debt in `tick`** — see the tick stanza below, not an external tracker.

## Intent methodology

Bakobo develops intent-first. If this repo has design decisions worth explaining, its source of
truth is `this.i` (the intent tree) at the repository root — code and `docs/` are derived from it.
Record each consequential decision in `this.i` **first**, in its own commit, **before** the code
commit it justifies. The full rules — what `this.i` is, when a repo needs one, the speculative
interview, the `why` rebuttal-surface standard, the gate ceremony, and adversarial review — are in
[`dev/methodology.md`](../dev/methodology.md), in the sibling `bakobo/dev` repo. Read it before
making design decisions here.

If this repo has no `this.i` yet and warrants one, see [`dev/methodology.md`](../dev/methodology.md)
§2 and the shipped `this.i.seed`. A trivial repo (pure content/assets/config, where no one will
later need to know *why*) may skip intent entirely — just delete `this.i.seed`.

## Repository commands

- **Toolchain:** Node.js 24+, npm. This is a Vite + React + TypeScript static SPA
  (decision `w4bn2p` in `this.i`).
- **Install:** `npm install`
- **Test command:** `npm test` (Vitest). Coverage: `npm run coverage` — CI enforces
  **100% branch coverage of new code** (methodology.md §6).
- **Build:** `npm run build` (type-check + static bundle to `dist/`). Dev server: `npm run dev`.
- **Deploy:** pushing to `main` publishes `dist/` to GitHub Pages at `cesrview.bakobo.com`
  via `.github/workflows/deploy.yml`.

## Testing Protocol

Follow **strict TDD**: for each requirement, write failing tests that capture the happy path
and the edge/unhappy cases first, observe them fail, then implement until they pass. Never
check in without proving the whole suite passes (`npm test`). Aim for **100% coverage of all
new code**, and always leave existing code better tested than you found it. The test plan is
approved in the speculative interview *before* implementation (methodology.md §5–§6).

## CI and Documentation

CI runs on every push and pull request via `.github/workflows/ci.yml` (build + test + coverage).
Keep it green; a red build blocks the gate (methodology.md §9). Keep `README.md` accurate as the
fresh-clone-to-passing-tests entry point.

When writing or modifying GitHub Actions workflows, always use the latest
stable release of each action. Avoid versions pinned to Node.js 16 or
Node.js 20 (both deprecated by GitHub). In 2026, this meant to prefer Node.js
24-compatible versions, but the standard may evolve over time. Check the GitHub
Marketplace for each action's current release.

<!-- >>> tick stanza >>> (managed by `tick init`) -->

## Task tracking: `tick`

This repo tracks tasks, tech debt, and ideas in a local [`tick`](https://github.com/dhh1128/tick)
ledger (an orphan `tick` branch; the `tick` CLI is the interface). Reads are plain
files — do **not** use an external API for task tracking.

- **First, if a `tick` command says the repo isn't initialized**, run `tick init`
  once to connect this clone to the ledger — it adopts the existing remote ledger
  if a colleague already set one up, or creates a new one otherwise.
- **A tick mark is the sigil `~` immediately followed by a digit-first 4-char
  base32 id** (the id part looks like `4mz3`, so the full mark is that id with a
  leading `~`). It pins a tick to a code location.
- **Before editing a file**, grep it for marks and read what they reference:
  `rg '~[2-7][a-z2-7]{3}\b' <file>` then `tick show <id>`. A mark means recorded
  context exists for that spot — read it first.
- **Search** existing ticks with `tick grep <text>`; **list** with `tick ls`.
- **Capture** new work with `tick add "<title>"` and place the printed mark
  (`~` + the new id) at the relevant code spot.
- When your change **resolves** a tick, run `tick off <id>` and **delete the
  mark(s)** it reports still in the code.

<!-- <<< tick stanza <<< -->
