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

    Primary user is the expert debugging a real stream = decision:
      id: q7m4rp
      why: >
        Confirmed in the Phase-1 UX interview: cesrview optimizes first for an intermediate/expert
        developer inspecting a specific real CESR stream, not for a newcomer learning the format
        from scratch. Chose the jwt.io posture — dense, information-first, fast — with teaching kept
        always one hover/click away rather than presented as inline prose. Rejected a
        teaching-forward default (gentle, explanation-heavy) and an equal-weight "serve both" design,
        because serving learner and expert equally without a mode switch tends to please neither, and
        the real corpus (a 102-event multisig KEL, a 4-ACDC chained presentation) is expert-shaped
        work. Accepted tradeoff: newcomers get a steeper first impression, mitigated by annotations
        and a curated sample library. This is the master UX intent from which the density, navigation,
        annotation-prominence, and the decisions nested below follow.
      children:
        Statement foreground, proof layer demoted = decision:
          id: v3nk7t
          why: >
            A CESR stream stacks a human-readable signed statement (the JSON event) over opaque
            base64 proof groups (indexed/witness signatures, receipt couples, seal sources — the
            nested -VDC/-AAD/-BAF counter groups seen in samples/multisig-oobi.cesr). Chose to make
            the signed statement the visual foreground and render the proof groups as a distinct,
            muted, collapsed-by-default band (fully annotated on open, with a global hide-proof
            toggle), over giving the two domains equal weight or foregrounding the crypto. The
            expert-debug user (@q7m4rp) is usually reading semantic content and wants the proof
            present but out of the way, and this asymmetry is the product's core visual signature that
            distinguishes it from a generic JSON viewer. Accepted tradeoff: a proof-forward user must
            toggle/expand to make the cryptographic material primary.

        Structure-only viewer with self-contained integrity checks = decision:
          id: b6zx2d
          why: >
            cesrview is a viewer, not a verifier, but users will read "signatures shown" as
            "signatures valid." Chose to make NO cryptographic-validity claims in v1 (no green checks,
            no "valid" language) while still performing the checks that need no external state — SAID
            recomputation and serialization-length agreement — surfaced explicitly as "structural
            integrity," visibly distinct from cryptographic validity. Rejected both zero-validation
            (misses cheap, honest, self-contained signal) and full in-browser signature/key-state
            verification (much larger scope, needs crypto plus KEL key-state resolution, and creates a
            "we said valid but were wrong" failure that violates fail-closed). This applies the org
            fail-closed principle: an unverifiable claim of validity is not made. Accepted tradeoff:
            users must confirm cryptographic validity elsewhere; full verification is deferred.

        View-only, with read-only text/binary reveal = decision:
          id: j4wc5h
          why: >
            Chose to keep v1 view-only — no editing, no re-serialization — while exposing CESR's
            unique text/binary domain duality read-only: any primitive can reveal its binary-domain
            form and "copy as binary." Rejected strictly-view-only (misses a distinctive CESR teaching
            moment that is nearly free once the parser exists) and editing/re-serialization (a much
            larger tool with a far bigger correctness and security surface, out of scope for a
            paste-and-prettify v1 per @n2fq6b). Accepted tradeoff: users cannot mutate or convert whole
            streams in v1.

        No payload-in-URL sharing; ship a sample library instead = decision:
          id: r7pm3q
          why: >
            Deliberately NOT providing shareable permalinks that encode the pasted stream in the URL,
            though a "share this parse" link is an obvious jwt.io-style feature. Encoding a
            possibly-key-bearing CESR stream into a URL is exfiltration — it can land in browser
            history, server logs, and referrer headers — which violates the root-goal privacy
            constraint (@k7t3mq: nothing leaves the machine) and fail-closed. Instead ship a curated
            one-click sample library (corpus sanitized/blessed for inclusion) so users have shareable
            reference material without exfiltrating their own data. Accepted tradeoff: no deep-link to
            a specific user parse; users share by sending the raw CESR out-of-band.

        Render AIDs with entviz <EntvizPill> = decision:
          id: g2hd6n
          why: >
            Chose to render every KERI AID (44-char base64 identifier) via the published entviz React
            component (@entviz/react <EntvizPill>) rather than as raw base64 text or a bespoke pill.
            Real streams carry ~80 near-identical-looking AIDs that cross-reference each other
            (samples/multisig-oobi.cesr); entviz gives a compact clickable pill with a deterministic
            visual fingerprint that lets users tell same-vs-different AIDs apart at a glance, plus
            copy/expand — solving the identifier-web legibility problem for free. The pill label is
            host-controlled (short prefix or full value) and its default type annotation is turned off
            (showType=false). Accepted tradeoff: an external UI dependency (@entviz/react, peer
            React >=17, only transitive dep @noble/hashes, themeable via --entviz-pill-* vars) whose
            release cadence we track; justified because it is maintained in-house (bakobo/dhh1128).
