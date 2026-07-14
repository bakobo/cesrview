[![CI](https://github.com/bakobo/cesrview/actions/workflows/ci.yml/badge.svg)](https://github.com/bakobo/cesrview/actions/workflows/ci.yml)

# cesrview

A **jwt.io for CESR**. Paste a KEL, TEL, ACDC, or OOBI response and cesrview turns the opaque
[CESR](https://trustoverip.github.io/kswg-cesr-specification/) stream into a clear, prettified data
structure — every primitive and group annotated with a link back into the CESR specification so you
can learn what it means.

It runs **entirely in your browser**. No backend, nothing uploaded: CESR streams can carry sensitive
key material, so parsing happens client-side and your data never leaves your machine. The site is a
static build served from GitHub Pages at **[cesrview.bakobo.com](https://cesrview.bakobo.com)**.

> **Status:** early scaffold. The parsing/annotation engine is in progress — see
> [`this.i`](./this.i) for the design decisions driving it.

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
