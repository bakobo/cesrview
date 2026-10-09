[![CI](https://github.com/bakobo/cesrview/actions/workflows/ci.yml/badge.svg)](https://github.com/bakobo/cesrview/actions/workflows/ci.yml)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)

# cesrview

A **jwt.io for CESR**. Paste a KEL, TEL, ACDC, or OOBI response and cesrview turns the opaque
[CESR](https://trustoverip.github.io/kswg-cesr-specification/) stream into a clear, prettified data
structure — every primitive and group annotated with a link back into the CESR specification so you
can learn what it means.

It runs **entirely in your browser**. No backend, nothing uploaded: CESR streams can carry sensitive
key material, so parsing happens client-side and your data never leaves your machine. The site is a
static build served from GitHub Pages at **[cesrview.bakobo.com](https://cesrview.bakobo.com)**.

> **Status:** early. The parsing/annotation engine (`src/cesr`, `src/annotate`) frames real
> KERI/ACDC streams in CESR v1 and v2 — see below. A first inspector UI sits on top of it and is
> still thin. cesrview decodes structure only; it does not verify signatures or digests. See
> [`this.i`](./this.i) for the design decisions driving every part.

## What the UI does today

- Paste a stream, drop a file onto the input panel, or load one of the bundled samples in
  `public/samples/` (CESR v1, plus v2 twins of the two witness OOBIs).
- The input panel shows the stream pretty-printed as numbered source lines.
- A left rail outlines the stream's events and the logs they belong to; the centre shows one
  decoded event at a time, with its fields, attachment groups and links into the spec.
- Identifiers render as [entviz](https://github.com/dhh1128/entviz-js) pills, so the same AID is
  recognisable wherever it appears.
- A header shows the stream's kind and counts, a light/dark toggle, and a print menu that prints the
  prettified stream, the outline, or the current event.
- A component gallery for development is at `/#gallery`.

## What the engine does today

The `src/cesr` **walker** turns a v1 or v2 CESR byte stream into a typed decomposition with byte-span
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

In development the walker frames a local corpus of real streams to the exact byte with zero errors; CI checks it against committed keripy oracle fixtures.

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

## License

Apache-2.0.
