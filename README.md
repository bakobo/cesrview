[![CI](https://github.com/bakobo/cesrview/actions/workflows/ci.yml/badge.svg)](https://github.com/bakobo/cesrview/actions/workflows/ci.yml)

# cesrview

A **jwt.io for CESR**. Paste a KEL, TEL, ACDC, or OOBI response and cesrview turns the opaque
[CESR](https://trustoverip.github.io/kswg-cesr-specification/) stream into a clear, prettified data
structure — every primitive and group annotated with a link back into the CESR specification so you
can learn what it means.

It runs **entirely in your browser**. No backend, nothing uploaded: CESR streams can carry sensitive
key material, so parsing happens client-side and your data never leaves your machine. The site is a
static build served from GitHub Pages at **[cesrview.bakobo.com](https://cesrview.bakobo.com)**.

> **Status:** engine in progress; no UI yet. The headless parsing/annotation engine
> (`src/cesr`, `src/annotate`) already frames real v1 KERI/ACDC streams end-to-end — see below.
> The dual-pane inspector UI is not built yet. See [`this.i`](./this.i) for the design decisions
> driving every part.

## What the engine does today

The `src/cesr` **walker** turns a v1 CESR byte stream into a typed decomposition with byte-span
provenance on every node, delegating primitive/counter sizing to `signify-ts`:

- Frames each message (version string → body → attachments) deterministically, no `{`-sniffing.
- Decomposes the universal `-V`/`-0V` attachment wrappers and the controller/witness signature,
  receipt, seal-source and trans-sig groups (`-A`…`-I`) into typed nodes — including the compound
  groups that nest a `-A` inside (`-F`, `-H`).
- Is **resilient** (three-state `known`/`unknown`/`invalid`): a size-known wrapper is a boundary the
  walk recovers past, so it never fails all-or-nothing on unfamiliar input.
- Tags each primitive with its Matter/Indexer class so ambiguous codes resolve correctly.

The decoupled `src/annotate` **annotation layer** maps each code and message ilk to a plain-language
gloss plus a deep link into the CESR/KERI spec — the teaching value-add, kept out of the
upstreamable walker.

The walker frames the full local test corpus to the exact byte with zero errors.

## Develop

Requires Node.js 24+.

```bash
git clone https://github.com/bakobo/cesrview
cd cesrview
npm install        # install dependencies
npm test           # run the test suite (should be green)
npm run dev        # start the dev server at http://localhost:5173
```

Other scripts:

| Command | What it does |
|---|---|
| `npm run build` | Type-check and produce the static production bundle in `dist/` |
| `npm run coverage` | Run tests with coverage (100% branch coverage of new code is enforced) |
| `npm run preview` | Serve the production build locally |

## How this repo works

cesrview follows the [Bakobo engineering standards](./AGENTS.md): intent-first development with the
design rationale recorded in [`this.i`](./this.i) **before** the code it justifies, and strict TDD.
Read `AGENTS.md` before making changes.
