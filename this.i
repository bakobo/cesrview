# cesrview — Intent Tree (this.i)
#
# Source of truth for WHY cesrview is built the way it is. Code and docs are derived.
# Record each consequential decision here (methodology.md §3) in its own commit, BEFORE the
# code commit it justifies (methodology.md §5). See bakobo/dev/methodology.md.

Make CESR legible to developers in the browser = goal:
  id: k7t3mq
  why: >
    cesrview exists to turn opaque CESR streams (KELs, TELs, ACDCs, OOBI responses) into clear,
    prettified data structures annotated with links back into the CESR specification — a "jwt.io
    for CESR" that lowers the learning curve for anyone building with CESR/KERI. Chose a fully
    client-side static site over (a) reviving the old provenant-dev/cesrview Nuxt tool, whose
    hand-copied v1 code table is now years stale, and (b) building a backend parsing service.
    Two constraints drive the choice: CESR streams may carry sensitive key material that must
    never leave the user's machine, and a static GitHub Pages site has near-zero operating cost
    and no server the user must trust. Accepted tradeoff: parsing must run entirely in-browser,
    so we depend on a browser-capable CESR engine rather than the mature Python reference
    implementation (keripy).
  children:
    React + Vite + TypeScript static SPA = decision:
      id: w4bn2p
      why: >
        Chose React + Vite + TypeScript building a static SPA over the old tool's Nuxt/Vue stack
        and over any server-rendered framework, because a stated deliverable is a REUSABLE CESR
        viewer React component that other Bakobo apps can embed, and Vite produces a zero-config
        static bundle that deploys straight to GitHub Pages under the custom domain. Accepted
        tradeoff: SPA-only means no server-side rendering or SEO for deep-linked parses, which is
        acceptable because the tool is interactive-first and holds no durable content to index.

    In-browser TS stream-walker, upstreamed; keripy as oracle = decision:
      id: h6rk4d
      stage-status: planned
      why: >
        Chose to write a native-TypeScript CESR stream-walker and contribute it plus current
        (v2.0.0) code tables UPSTREAM to signify-ts, over (a) shipping keripy's reference Parser
        in the browser via Pyodide/WASM and (b) a viewer-private throwaway parser. signify-ts is
        already browser-native and has the primitive classes (Matter, Counter, Siger, Diger,
        Serder) but has NO stream parser and only v1-era tables; keripy has the canonical Parser
        (keri.core.parsing) and tracks the spec, but its "WASM support" so far is only an
        IndexedDB storage shim (keri.db.webdbing) toward running under Pyodide — a multi-MB Python
        runtime that cold-starts on every visit, defeating the instant jwt.io feel. A viewer-only
        fork would waste an ecosystem contribution. Accepted tradeoff: we own and must maintain
        the walker and keep its v2 tables current with the spec — mitigated by differential-testing
        every parse against keripy's canonical Parser as a golden oracle. Provisional pending the
        Phase-1 engine spike (see @t3zc5m); keripy-via-Pyodide is the documented fallback, and if
        the spike overturns this, record a tension rather than editing this node silently.

    UX-first, with a parallel engine feasibility spike = decision:
      id: t3zc5m
      why: >
        Chose to lead with UX/requirements design — which doubles as the speculative interview
        that populates this tree — while running a parallel engine feasibility spike, over both
        pure-UX-first and engine-first. Pure-UX-first risks designing an experience the in-browser
        engine cannot feed (e.g. if v2 counter groups prove unparseable client-side); engine-first
        leaves the jwt.io-grade quality bar undefined too long. The spike proves one real KEL and
        one real ACDC walk to an annotated tree, and stands up the keripy oracle harness, before
        UX is frozen. Accepted tradeoff: running two tracks at once costs more coordination than a
        single linear sequence.

    v1 scope is paste-and-prettify, no network fetch = decision:
      id: n2fq6b
      why: >
        Chose to ship the first shippable version as paste-and-prettify with NO network fetching,
        over including OOBI/KEL/TEL retrieval from a pasted URL. Fetching arbitrary witnesses and
        watchers cross-origin requires a proxy or runs into CORS, which collides directly with the
        backend-free constraint in the root goal. Accepted tradeoff: v1 users must paste CESR
        themselves; URL/OOBI fetch lands in a later phase once the CORS/proxy approach is decided.
