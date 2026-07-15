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
      children:
        Consume signify-ts tables; author only the annotation layer = decision:
          id: w6ph4k
          why: >
            Chose to CONSUME the structural code tables (code -> hard/soft/full length and framing
            semantics) by delegating primitive, counter and indexer parsing to signify-ts's
            Matter/Counter/Indexer classes and their size tables, rather than authoring a fresh
            code-table artifact — a hand-kept copy would inevitably drift from the spec and from the
            implementations. Where signify-ts is incomplete (notably v2), contribute the additions
            UPSTREAM (keripy and the spec as reference) rather than fork a private table, keeping one
            source. cesrview authors ONLY the annotation layer (code/field -> human gloss +
            spec-anchor URL), which is the product's teaching value-add, is descriptions not sizes,
            and is therefore low drift-risk even though keyed by signify-ts's codes. Rejected
            consuming cesride (Rust->WASM adds weight and is not our contribution target) and
            build-time generation from keripy (still yields a local file to keep in sync). Accepted
            tradeoff: a runtime dependency on signify-ts's parsing classes, and coupling our v2
            support to landing upstream table additions.
          children:
            Annotate CESR codes and message ilks in a decoupled teaching module = decision:
              id: x4nb7q
              why: >
                Built the annotation layer @w6ph4k promised as a SEPARATE cesrview module (src/annotate)
                that the walker does NOT import, so the walker stays the generic, upstreamable
                decomposition (@m4dp7k, @n6wd3k) while the teaching content — the product's value-add —
                lives on top. It maps each STRUCTURAL code to a human gloss plus a spec-anchor URL:
                counter/group codes (-A ControllerIdxSigs through -V AttachedMaterialQuadlets), Matter
                and Indexer primitive codes (looked up per class per @d7km3p, since the two tables
                collide), and message ilks (icp/rot/ixn/dip/drt/rpy and common TEL types). Anchors
                deep-link to the relevant spec SECTION (e.g. the CESR spec #count-code-tables), not to
                per-code fragments, because the specs render codes inside tables with no stable per-code
                ids — verified against the published CESR spec, and every URL is checked to resolve
                before it ships. Rejected per-code fragment anchors (they do not exist and would 404)
                and baking glosses into walker nodes (@m4dp7k forbids it). Message FIELD-KEY glosses
                (v/t/d/i/s/kt/k/n/...) are deferred as tracked debt: they annotate the message JSON
                rather than the code-bearing nodes and span the KERI and ACDC specs, a distinct body of
                content. Lookup is fail-soft — an unannotated code returns null and the node still
                renders (the @d3rk6n spirit). Accepted tradeoff: the gloss/URL table is hand-authored
                and versioned in cesrview until the walker is upstreamed, kept low-drift because it is
                descriptions, not sizes (@w6ph4k).

        Table-driven walker is v2-capable, not v1-only = tension:
          id: c4nk7p
          why: >
            @s4hd6q recorded "detect non-JSON and non-v1 genus, FAIL CLOSED", which over-narrowed the
            engine toward v1-only and conflicts with this node's (@h6rk4d) intent to build and
            upstream a v2-CAPABLE walker to signify-ts. Confirmed with the owner: a v1-only walker is
            a weak contribution and was not the intent.
          resolution: >
            The walker is TABLE-DRIVEN and v2-capable: v1 vs v2 is a version-string + table concern,
            not two parsers, so it handles whatever the (signify-ts) tables cover. v1 is fully tested
            against the real corpus now; v2 code paths and tables are filled in and tested as tables
            (and any v2 data) mature. Fail-closed (@s4hd6q) now applies only to GENUINELY unsupported
            genus/serialization not yet in the tables — not to v2 as a category, and not to CBOR/MGPK
            once their sniff/table support lands. cesrview the PRODUCT is still polished and tested
            against the v1 corpus first; the ENGINE is v1+v2. @s4hd6q and @h6rk4d both hold under this
            reconciliation.

        Walker emits a keripy-shaped typed tree with byte provenance = decision:
          id: m4dp7k
          why: >
            Chose the walker's output contract to MIRROR keripy's per-message decomposition — a
            deserialised message (Serder-equivalent) plus TYPED attachment groups (controller indexed
            sigs, witness sigs, nontrans receipt couples, trans idx sig groups, seal-source
            couples/triples, SAD-path sig groups) — because approximating the shape of the shipping
            reference parser (keri.core.parsing) makes the walker a more natural upstream contribution
            to signify-ts and reuses a decomposition CESR practitioners already know. cesrview's
            ADDITION is byte-span PROVENANCE on every node (message, group, primitive): the [start,end)
            offset in the original stream, which keripy does not track (it processes into a DB, not a
            rendered source pane). Chosen over (a) a flat token+offset stream (pushes tree assembly and
            group typing onto every consumer) and (b) annotations baked in (couples the upstreamable
            walker to cesrview's teaching layer, violating @w6ph4k). Byte provenance is a superset
            keripy lacks but is independently useful (exact-byte verification) and non-conflicting, so
            it does not compromise upstreamability. Accepted tradeoff: threading offsets through
            recursive framing is slightly more bookkeeping than a process-only parser.
          children:
            Tag each primitive with its Matter or Indexer class = decision:
              id: d7km3p
              why: >
                A Primitive node's `code` alone is AMBIGUOUS: the same qb64 selector means different
                things in the Matter table versus the Indexer table (e.g. 'A' is a seed as Matter but
                an indexed Ed25519 signature as Indexer), so a consumer cannot annotate or label it
                without knowing which table it came from. Added a `class: 'matter' | 'indexer'`
                discriminator, which the walker already knows at framing time (a 'sig' part is framed
                by Indexer, a 'p' part by Matter), making the decomposition self-describing and letting
                the annotation layer (@w6ph4k) and the UI resolve the correct code table and render
                "indexed signature" versus "digest/key". Rejected leaving the caller to infer the class
                from group context (pushes CESR table knowledge into every consumer, and the output
                tree does not otherwise encode that a -A's children are indexed sigs) and putting a full
                per-primitive type NAME in the walker (that is the annotation layer's job — baking
                teaching into the upstreamable module would violate @w6ph4k/@m4dp7k). Refines @m4dp7k;
                the byte-provenance contract and keripy-shaped decomposition are otherwise unchanged.
                Accepted tradeoff: one more field threaded through primitive framing.

        Resilient three-state parse - known, unknown-but-framed, invalid = decision:
          id: d3rk6n
          why: >
            On imperfect input the walker never fails all-or-nothing (a debugger must show the broken
            stream it is handed): it returns everything parsed up to a failure plus a typed error node
            at that byte boundary. It distinguishes THREE outcomes per element, honouring CESR's
            self-framing design: KNOWN (code in the tables -> parsed and annotated); UNKNOWN-BUT-FRAMED
            (code not in the tables but its byte size is derivable from CESR's selector/size-class
            rules, or it sits inside a -V/-0V quadlet wrapper whose length is count*4 -> framed
            structurally, byte span known, marked "unrecognised code", no annotation); and INVALID
            (cannot be framed even by size rules -> typed error). The unknown-but-framed state is what
            makes a v2-capable parser tolerant of v2.x/3.x additions it does not yet annotate.
            Empirically, signify-ts today THROWS "Unsupported code" on any unknown code (verified) — it
            does NOT self-frame unknowns — so selector/size-class framing is a capability cesrview
            IMPLEMENTS and contributes upstream, not one it inherits. Rejected strict-throw (wrong tool
            for a debugger) and known-codes-only (brittle to the versioned future CESR is built for).
            Accepted tradeoff: selector/size-class sizing (the cold-start hard/lead/quadlet rules) is
            real work beyond consuming signify-ts's known-code tables; the -V wrapper covers the common
            attachment case meanwhile, and 100% of the real v1 corpus parses via known codes anyway.
          children:
            Decompose -V/-0V wrappers into a typed nested group sequence = decision:
              id: z4pm7k
              why: >
                Chose to recurse the universal material-quadlet wrappers -V (AttachedMaterialQuadlets)
                and -0V (BigAttachedMaterialQuadlets) into a TYPED nested sequence of attachment groups,
                reusing the same group framing used at the top level, so the KEL's real proof content
                (controller/witness sigs, receipt couples, seal sources) becomes typed nodes rather than
                an opaque count*4 byte span. This is what makes the typed proof band (@h5nw2c) real: 459
                of the 463 messages in the sample corpus wrap their proof in -V, so without this the
                walker shows almost no proof structure. The wrapper's OWN state stays framed ("known")
                whenever its size is derivable from count*4 — which is always, since a self-declaring
                wrapper size is the entire reason CESR defines the universal wrapper (a receiver can skip
                attachments it cannot parse). Inner framing problems surface as the CHILD node's own
                state plus a byte-positioned ParseError inside the wrapper, not by condemning the
                wrapper. Rejected marking the whole -V "invalid" when its contents are unrecognised
                (that conflates "could not size the wrapper", which never happens, with "did not
                recognise the contents", and blanks a wrapper we framed correctly, losing the debugger
                value of @r7cm3b). Deferred two things as tracked debt rather than widening this
                increment: -L (PathedMaterialQuadlets) inner decomposition, whose inner grammar is a
                leading path primitive then groups, not a plain group run; and using the known wrapper
                size as a resync boundary to CONTINUE the walk past a malformed -V (today the walk still
                stops conservatively on the first inner framing failure). Refines @d3rk6n; serves
                @h5nw2c; output shape unchanged (@m4dp7k already admits nested groups via AttachmentNode).
                Accepted tradeoff: mutual recursion between group framing and sequence framing, and
                carrying the -L / resync gaps as tracked debt until a later increment.
              children:
                Material-quadlet wrapper is a resilience boundary, inner limits never halt the walk = tension:
                  id: p3wk7n
                  why: >
                    z4pm7k deferred resync (tick 5ygd) and kept the conservative "stop the walk on
                    the first inner framing failure" behaviour. Running the decomposition against the
                    real corpus overturned that: every KEL event wraps its proof in a -V whose inner
                    content includes a -E (FirstSeenReplayCouples) group — and a compound -F
                    TransIdxSigGroups — the walker does not yet model (this why originally mislabelled
                    -E as TransIdxSigGroups; corrected per @t6nv4q), so stopping on the first
                    unmodelled inner group halted the walk at message 1
                    and regressed corpus framing from delta 0 to a single event. A -V that used to be
                    opaque (skipped as count*4 bytes) let the walk continue; DECOMPOSING it must not
                    make the walker less resilient than leaving it opaque.
                  resolution: >
                    A size-known material-quadlet wrapper (-V/-0V) is a RESILIENCE BOUNDARY: inner
                    decomposition proceeds until the first group the walker cannot frame or size, then
                    stops decomposing that wrapper — but the wrapper stays "known" (its size is
                    count*4), the groups decoded so far (including an "unknown" node for a recognised
                    but unmodelled counter) remain its items, and the walk RESUMES at the wrapper's
                    known end instead of halting. This brings the 5ygd resync forward, so that tick is
                    resolved; only a TOP-LEVEL group with no enclosing size to resync from still halts
                    the walk (unchanged, and it still surfaces genuine wrapper-size corruption because a
                    wrong count*4 desynchronises the next message's boundary). Model B (z4pm7k) holds
                    and is strengthened; its "stop the walk on inner failure" clause is withdrawn.
                    Modelling -E/-F/-D compound inner groups so decomposition is COMPLETE, not merely
                    resilient, is tracked separately.
                  children:
                    Model the compound trans-sig and receipt attachment groups = decision:
                      id: t6nv4q
                      why: >
                        Completed -V decomposition (@z4pm7k) by MODELLING the trans-signature and
                        receipt attachment groups that make up a KEL's proof, so the typed proof band
                        (@h5nw2c) shows real endorser sigs and receipts instead of the "unknown" gray
                        boxes @p3wk7n left behind: -C NonTransReceiptCouples (verfer, cigar), -D
                        TransReceiptQuadruples (prefixer, seqner, saider, siger), -E FirstSeenReplay
                        Couples (seqner, dater), -F TransIdxSigGroups (prefixer, seqner, saider plus a
                        nested -A ControllerIdxSigs group), and -H TransLastIdxSigGroups (prefixer plus
                        a nested -A group). This required EXTENDING the group-framing grammar with a
                        nested-GROUP element: a part can now be another attachment group, not only a
                        primitive, because -F and -H interleave primitives with an inner -A group.
                        Corrects a code-table error carried in the 7k4r tick and the @p3wk7n why — per
                        signify-ts's own table -E is FirstSeenReplayCouples and -F/-H are TransIdxSig
                        Groups/TransLastIdxSigGroups; the earlier text mislabelled -E as TransIdxSig
                        Groups. Rejected leaving these as resilient "unknown" children (honest but it
                        defeats the teaching mission for the 94 -E and 8 -F groups the corpus carries
                        inside its -V wrappers). Frames each nested group GENERICALLY through the same
                        frameGroup rather than hard-asserting it is -A as keripy does, because a viewer
                        should render whatever well-formed group is present, not throw. Correctness is
                        checked by a byte-alignment invariant — every -V's inner groups must sum
                        exactly to its count*4 with no unknown child or leftover — plus a keripy oracle
                        fixture, rather than by re-deriving primitive sizes (which stay delegated to
                        signify-ts). SadPath sig groups (-J/-K) and -L stay unmodelled and tracked, as
                        they carry a variable-length path primitive this increment does not tackle.
                        Accepted tradeoff: the grammar now supports nested-group parts (more framing
                        surface), and the walker carries a small hand-authored structural table for
                        these groups until it is upstreamed (@n6wd3k).

        Develop the walker in cesrview, upstream once proven = decision:
          id: n6wd3k
          why: >
            The walker is developed as a BOUNDED MODULE INSIDE cesrview (importing only published
            signify-ts for primitives; no React), and upstreamed to WebOfTrust/signify-ts (via the
            provenant-dev fork) once proven — rather than developed inside the signify-ts fork now.
            The local signify-ts is a provenant-dev fork whose true upstream (WebOfTrust) is a
            PR-gated community project; developing there would couple cesrview to an unpublished fork
            branch and the community merge cycle, and the unknown-but-framed selector enhancement
            wants to be proven before it is proposed. Building here keeps iteration fast under bakobo
            TDD/intent standards, while the module boundary (signify-ts-only imports) keeps later
            extraction trivial. Refines @w6ph4k and @m4dp7k. Rejected develop-in-fork (timeline
            coupling) and a separate package now (repo/publish overhead, and it diverges from the
            upstream-into-signify-ts intent). Accepted tradeoff: a later extraction/upstreaming step,
            and temporarily carrying any v2/selector additions locally until they land in signify-ts.

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

        IDE inspector is the chosen view direction = decision:
          id: m3xq7c
          why: >
            Chose the IDE-inspector direction over the two bake-off alternatives (a scaled-up-jwt.io
            editorial document and a relationship-canvas). Eliminated the canvas because it cannot
            scale to the hundreds of events real KELs contain and, worse, it dissolves sequence
            order, which is semantically load-bearing in KERI (the ordered event log IS the key
            history). Eliminated the editorial document because the confirmed expert user (@q7m4rp)
            wants density and tooling, not beautiful typesetting. Kept the canvas's one unique virtue
            — revealing links between identifiers — by importing it into the IDE view as
            cross-referencing (@c5nzr4) rather than a spatial map. Accepted tradeoff: the IDE view is
            less immediately approachable to a non-developer than the document direction was.

        Dual-pane source and decoded, CodeMirror + React = decision:
          id: p6hw4k
          why: >
            The decoded view needs rich interactive React (entviz pills, collapsible
            statement-over-proof, cross-ref affordances), while raw-text tooling (line numbers,
            search-highlight-all, copy, print, keyboard nav) is exactly what a code editor gives for
            free. Chose a jwt.io-style two-pane split — raw CESR in a READ-ONLY CodeMirror 6 editor on
            one side, our React decoded tree on the other, selection synced both ways — over (a)
            rendering everything in an embedded editor like Monaco (its text model cannot host React
            components, heavier bundle, IntelliSense is dead weight for read-only CESR) and (b) a
            single decoded pane where we reimplement editor tooling ourselves. The selection sync
            between the text and decoded domains is itself the teaching moment. Accepted tradeoff: two
            panes, a CodeMirror 6 dependency, and the cost of keeping the panes in sync.

        Three-layer identifier cross-referencing = decision:
          id: c5nzr4
          why: >
            Real streams reference ~80 identifiers that cross-link across distant events; a viewer
            that prettifies each event in isolation loses this. Chose a three-layer solution over any
            single mechanism: (1) PASSIVE — every occurrence of the same identifier carries the same
            deterministic entviz fingerprint AND accent colour, so correlation is always-on and needs
            no interaction (scales to hundreds of events with zero clutter); (2) ACTIVE — selecting an
            identifier highlights all its occurrences and offers jump-to-establishment and next/prev,
            the IDE "find all references" pattern; (3) GUTTER reference marks showing forward/back
            references without drawing a full graph. Separately adopt rainbow-matched delimiters for
            counter-group / JSON nesting legibility. Rejected the canvas's drawn-line web (doesn't
            scale, breaks sequence). Accepted tradeoff: more rendering machinery than a plain tree,
            and a dependency on per-identifier colour support in entviz (@g4mp2w).

        Extend entviz for per-identifier colour, upstreamed = decision:
          id: g4mp2w
          why: >
            The passive cross-ref layer (@c5nzr4) needs each identifier pill to carry a deterministic
            per-identifier background/accent colour, which the published @entviz/react may not yet
            expose. Chose to EXTEND the entviz React component and contribute the change upstream,
            rather than wrap or fork it locally, because cesrview is entviz's first real-world consumer
            and that feedback loop is how entviz matures — and entviz is maintained in-house
            (bakobo/dhh1128), so upstreaming is low-friction. Refines @g2hd6n. Accepted tradeoff:
            cesrview's identifier rendering is coupled to landing an entviz enhancement rather than
            shipping purely against today's published API.

        Compact layout, bottom annotation dock, desktop-first responsive = decision:
          id: t2vd6m
          why: >
            Values in a CESR stream are mostly small (integers, a single AID), so a permanent wide
            centre panel wastes space, and the dual-pane (@p6hw4k) already claims horizontal room.
            Chose a compact, left-weighted layout — left rail (outline + identifier index as entviz
            PILLS, not large glyphs) · the two panes · a BOTTOM annotation dock — over a permanent
            multi-column right rail. The dock is visible by default (annotations are the teaching
            mission, not an opt-in) but collapsible, and sits below rather than stealing pane width,
            matching DevTools muscle memory. The layout collapses to a single column with rails-as-
            drawers on narrow screens: responsive and graceful, but DESKTOP-FIRST, because CESR
            developers work on desktops. Rejected annotation-off-by-default and mobile-first. Accepted
            tradeoff: mobile works but is not optimised in v1.

        IDE affordances (line numbers, search, menus, hexdump) = decision:
          id: f7kb3q
          why: >
            To meet the expert user (@q7m4rp) on familiar ground, cesrview adopts IDE affordances the
            bake-off prototypes lacked: line numbers (in the source pane), stream-wide search with
            all-occurrence highlighting, right-click CONTEXT MENUS (copy value / copy binary / copy
            path / find references / open-in-spec) as a primary interaction rather than an afterthought,
            and a proper HEXDUMP (offset · hex · ASCII) for the binary-domain reveal (@j4wc5h) instead
            of raw bytes. The whole view is themeable LIGHT and DARK via CSS variables aligned with
            entviz's --entviz-pill-* vars. Accepted tradeoff: more interaction surface to build and
            test than a read-only tree.

        Colour cannot be the cross-reference invariant = tension:
          id: v7kd3m
          why: >
            Fresh-context adversarial review found the passive cross-reference layer's reliance on
            per-identifier COLOUR (@c5nzr4, @g4mp2w) unsound: hue = hash mod 360 collides badly across
            the ~2100 distinct high-entropy tokens a real stream carries, fails for colourblind users,
            and is illegible at a 15px swatch. Colour cannot be the sameness invariant.
          resolution: >
            The deterministic entviz FINGERPRINT glyph is the sameness invariant; per-value colour
            becomes secondary/decorative. Cross-referencing (passive same-fingerprint, active
            find-all-references, gutter marks) applies to ALL high-entropy values — the owner REBUTS
            the reviewers' "pills for AIDs only", because entviz visualises entropy of any kind
            (identifiers, keys, digests, signatures, nonces). Value CLASSES are distinguished instead
            by pill SHAPE (e.g. rounded vs square vs angular corners), which becomes part of the entviz
            extension (@g4mp2w) alongside or instead of the colour work.

        Source pane pretty-printed, both panes virtualised = tension:
          id: p4rz6b
          why: >
            Adversarial review and the engine spike both found that real CESR streams are a SINGLE
            physical line (0 newlines; 101 KB and 370 KB in the samples), so the dual-pane rationale's
            "line numbers for free" (@p6hw4k) is vacuous, a 370 KB single line is a CodeMirror
            performance cliff, and neither pane was virtualised.
          resolution: >
            The source pane renders a cesrview-PRETTY-PRINTED stream (a newline per message and per
            primitive) rather than the raw bytes — which makes line numbers meaningful and gives the
            byte<->node provenance that selection-sync needs — and BOTH panes are virtualised.
            Dual-pane and CodeMirror stand (@p6hw4k holds); only the left pane's content is reformatted,
            not literal.

        Proof band is typed per message type = tension:
          id: h5nw2c
          why: >
            Adversarial review found "statement over proof" (@v3nk7t) is not uniform across message
            types: rpy carries -FAB signer-seal couples, a TEL iss event has NO signature of its own
            (its authority is a seal anchored in the ISSUER's KEL — a different event), and an ACDC
            uses -IAB SAD-path signatures. A single -AAB "controller signature" band misrepresents
            most of the stream.
          resolution: >
            Render the proof band TYPED per message type, and where an event's authority lives in
            another event (seal -> KEL anchor), surface it as a cross-event LINK rather than a
            fabricated local signature. Statement-over-proof stands as the visual frame (@v3nk7t
            holds); the proof CONTENT is typed and may point elsewhere.

        Structural-integrity checks kept but corrected = tension:
          id: b3qm7d
          why: >
            Adversarial review found the structural-integrity checks (@b6zx2d) as prototyped are both
            unsafe and wrong: a naive SAID recompute (Blake3 over the event with the d field zeroed)
            FALSELY fails a valid blinded ACDC (the u salt / most-compact rules), and global green
            "integrity" chips read as signature validity while hiding per-event failures.
          resolution: >
            Keep the checks (a real anti-tamper signal) but done correctly: PER-EVENT not global,
            BLINDING-AWARE (honour the u / most-compact SAID rules), rendered in a NEUTRAL non-green
            treatment, and labelled "structural integrity, not signature validity." The owner chose
            keep-and-fix over dropping them. @b6zx2d holds in intent; its computation and presentation
            are corrected here.

        Context-menu actions need visible and keyboard equivalents = tension:
          id: f6tk4p
          why: >
            Adversarial review found context-menus-as-primary (@f7kb3q) hides core actions
            (copy-binary, find-references, open-in-spec) with no visible or keyboard path, and the
            prototype was entirely mouse-only with no keyboard or screen-reader semantics.
          resolution: >
            Every context-menu action has a VISIBLE affordance and a KEYBOARD path; context menus are
            an accelerator, not the only route. Full keyboard navigation and meaningful screen-reader
            semantics across all regions are first-class v1 requirements, not deferrable polish.
            @f7kb3q holds; its "primary" framing for context menus is downgraded to "accelerator".

        Stream modelled as multiple KELs preserving stream order = decision:
          id: k2vx5n
          why: >
            A CESR stream commonly interleaves MULTIPLE KELs — 11 distinct event-owning AIDs in the
            sample — each with its own sequence space, so s-values recur across AIDs and a flat
            single-sequence outline is misleading (an owner correction to the reviewers' by-AID-only
            proposal). But the physical STREAM ORDER is itself meaningful — it is how the data arrived
            and a dimension worth inspecting. Chose to model BOTH orderings: group events by owning AID
            with per-AID sequence lanes (surfacing gaps and duplicity), AND retain a stream-order
            view/toggle — over indexing by AID alone (loses arrival order) or by stream order alone
            (the misleading flat log). Accepted tradeoff: two orderings to render and keep coherent,
            and event-owner attribution must be computed during the parse.

        First-class failure, empty and loading states = decision:
          id: r7cm3b
          why: >
            For a debugging tool the FAILURE state is the product: malformed, truncated, partial,
            bare-attachment and wrong-paste inputs are the common case, not an edge case. Chose to
            design the empty, loading, partial-parse and error states as first-class surfaces with
            fail-closed, high-quality errors (stable symbolic code, plain-language sentence,
            retryable-or-not) per the Bakobo error-handling standard, over treating them as
            afterthoughts. Rejected a happy-path-only v1. Accepted tradeoff: more states to design and
            test up front.

        Detect non-JSON and non-v1 genus, fail closed = decision:
          id: s4hd6q
          why: >
            Real data is v1 KERI10JSON / ACDC10JSON, but CESR interleaves CBOR, MGPK and CESR-native
            field maps and defines a v2 genus (--AAACAA). Chose to DETECT non-JSON message bodies and
            non-v1 genus and FAIL CLOSED with a clear "not yet supported" surface, rather than silently
            mis-parse or break (which would violate fail-closed). Refines @h6rk4d and the v1 scope
            @n2fq6b. Accepted tradeoff: detection/sniff code lands before the corresponding support.
