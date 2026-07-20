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
      children:
        CESR visualization ships as a separate package, not just this app = decision:
          id: r4vkp7
          why: >
            The reusable deliverable in @w4bn2p is sharpened: CESR VISUALIZATION ships as its own
            publishable package that any project can embed WITHOUT the cesrview application, rather
            than as a single monolithic <CesrViewer> or as components welded into this app. Three
            tiers: (1) a FRAMEWORK-AGNOSTIC data core — the walker (@n6wd3k), the annotation layer
            (@w6ph4k) and the stream model (@w3rn6k), already React-free and importing only
            signify-ts; (2) a library of GRANULAR, prop-driven React presentation components that
            render data-core outputs a la carte (a primitive chip, an attachment/proof group, a
            decoded event, a KEL lane) and hold no app state; (3) the cesrview APP shell (dual-pane,
            rails, dock, source<->decoded sync per @p6hw4k / @t2vd6m) that COMPOSES tier 2 into this
            product. Tiers 1 and 2 are what other UIs consume; tier 3 stays app-specific. Split into
            TWO packages — a framework-agnostic core (walker + annotate + model, no React, usable from
            Node or any framework) and a React component library that depends on it — so the core is
            reusable beyond React; the exact names are settled when the component API stabilises.
            Rejected a single embeddable <CesrViewer> (loses the chunk-level reuse the owner wants:
            one event, one proof band, one lane on their own) and permanently bundling components
            inside the app repo (couples reuse to the app's release). Following @n6wd3k's pattern the
            code is DEVELOPED HERE in src/ under TDD and EXTRACTED to the package(s) once the
            component API is proven, avoiding premature repo/publish overhead. The component API is a
            first-class output of the Phase-3 UX interview, not an afterthought. Accepted tradeoff: a
            later extraction step and an app-depends-on-package edge once split.
          children:
            Tier-2 is prop-driven leaves plus a thin viewer context, built stream-order first = decision:
              id: b4wnk7
              why: >
                Phase-3 UX interview outcome, settling the component architecture @r4vkp7 deferred to
                it. The tier-2 package is a library of PROP-DRIVEN LEAF components (a primitive chip, an
                attachment/proof group, a decoded event, a KEL/TEL lane) plus a THIN, OPTIONAL viewer
                CONTEXT that supplies shared interaction state — selection and identifier
                cross-referencing (@c5nzr4). A consumer can render a single chunk from props alone, OR
                wrap a subtree in the context to get always-on correlation for free; the app (tier 3) is
                then a thin composition, not the owner of component smarts. Chose this over
                pure-presentational components (every consumer would re-implement cross-ref) and over
                stateful leaf components (breaks the standalone-chunk reuse @r4vkp7 wants). The DEFAULT
                view is the STREAM-ORDER spine — decoded messages top to bottom as they arrived — with
                the KEL/TEL/delegation model (@k2vx5n) as the left-rail index and jump-navigation
                (@t2vd6m), because the expert debugging a specific stream (@q7m4rp) reads arrival order
                first; by-owner lanes are the alternate ordering, not the default. Build order is
                library-first and INCREMENTAL: the decoded pane with annotations (@w6ph4k) first, then
                the viewer context + cross-ref, then the source pane with selection sync (@p6hw4k /
                @p4rz6b), then structural integrity (@b3qm7d) — and entviz pills LAST. Pills are deferred
                because entviz is being actively enhanced (new color, shape-by-value-class and
                similar-value affordances the owner is still settling, refining @g4mp2w / @v7kd3m);
                until they land, high-entropy values render as a simple placeholder chip and
                cross-referencing keys on VALUE EQUALITY rather than the fingerprint glyph, upgrading to
                the entviz fingerprint once entviz settles (its new affordances are to be STUDIED at
                integration time, not assumed). Keyboard and screen-reader access are in from the first
                component, not bolted on (@f6tk4p). Accepted tradeoff: a viewer-context seam through the
                component tree, and a placeholder chip later swapped for the entviz pill.
              children:
                Cross-ref via an optional selection context and a high-entropy value chip = decision:
                  id: c7vn4k
                  why: >
                    Implements the viewer-context cross-referencing @b4wnk7 / @c5nzr4 describe, in its
                    value-equality form (@v7kd3m's fingerprint arrives with entviz later). A ValueChip
                    renders any high-entropy value as a selectable control; a thin, OPTIONAL CesrView
                    context holds the single SELECTED value; and a useCrossRef(value) hook lights every
                    chip whose value equals the selection — so selecting one identifier highlights ALL
                    its occurrences (@c5nzr4 layers 1-2: passive sameness plus active highlight), across
                    the message body and the attachments alike. The context is OPTIONAL: with no
                    provider useCrossRef is a no-op, so a single chip still renders standalone (@r4vkp7
                    / @b4wnk7). "High-entropy" is a base64url string of 44 or more characters (AIDs,
                    digests and keys are 44, signatures 88), which excludes thresholds (1/3), ilks and
                    sequence numbers — matching @v7kd3m's "all high-entropy values, not AIDs only"
                    without cross-referencing noise. Body field values render through a recursive
                    SadValue that chips high-entropy strings (and array elements, such as the key list)
                    while leaving small values as plain text. Chose value-equality over building an
                    occurrence index now (the index — for counts, next/prev and jump-to-establishment —
                    is a later increment) and over field-key-based detection (brittle; the entropy of
                    the value is the real signal). Deferred: the gutter reference marks (@c5nzr4 layer
                    3, needs the source pane), find-all-references navigation, and the entviz
                    fingerprint/color (@g4mp2w, entviz still settling). Accepted tradeoff: highlight is
                    O(chips) per selection with no occurrence count, and the predicate is a heuristic
                    tunable as real streams exercise it.

                Teach inline over a dock; lightweight outline; characterized stream = decision:
                  id: n8kr4p
                  why: >
                    A UX pass with the confirmed expert user (@q7m4rp) moved cesrview's TEACHING from a
                    click-a-dock model toward INLINE explanation, where the meaning sits next to the data.
                    Message field keys carry a short gloss in parens (`i (prefix/AID)`, realizing the
                    deferred field-gloss work); the version string and datetimes show the raw token then a
                    prettified reading in parens (`KERI10JSON00037f_ (KERI 1.0, JSON, 895 bytes)`;
                    `2020-…+00:00 (Sat, 22 August 17:50 UTC)`); the ilk gloss reads as inline explanatory
                    text on the event. Inline explanation beats a separate panel one must click and look
                    away to read — this is the recorded GROUND for RETIRING the annotation dock (@w6ph4k's
                    teaching surface) in the next layout pass, moving its one unique affordance (spec
                    deep-links) inline onto codes. The OUTLINE is re-cut as lightweight NAV (arrival order
                    still load-bearing, @m3xq7c / @k2vx5n): a 1-based stream position, the ilk, and the hex
                    sn per row, with the owning identifier shown as a COLLAPSED entviz PILL in a
                    section-header row at each owner change — never a full entviz visualization inline (a
                    full render only ever appears when a person clicks a pill), replacing the per-row owner
                    glyph that read as heavy. A best-effort STREAM CHARACTERIZATION (inferred kind — KEL /
                    OOBI-reply / TEL / mixed — plus a per-ilk composition) shows in the header, stated as
                    an inference. Accepted tradeoff: inline glosses spend horizontal space and carry a
                    hand-authored field glossary (KEL senses; a few keys differ in ACDCs); the kind is a
                    heuristic.

                Retire the dock; one event at a time; the input panel is the source = decision:
                  id: r8kv3p
                  why: >
                    Realizes the @n8kr4p direction as a LAYOUT simplification, reversing three earlier
                    calls now that teaching is inline. (1) The annotation DOCK is removed (@w6ph4k's
                    bottom teaching surface): its glosses already read inline, and its one unique
                    affordance — the spec deep-link — moves inline as a small ↗ on codes (the ilk badge,
                    the counter code). The CesrView context keeps only cross-reference selection; the
                    focus half is deleted. (2) The centre shows exactly ONE DecodedEvent at a time — the
                    one selected in the outline (an outline click SELECTS, no longer scrolls) — reversing
                    the show-ALL centre with progressive render (@v3mk7n) and the same-owner ixn
                    run-collapse (@r6nk2w), which existed only to bound the cost of rendering every event
                    at once. One event is a far lighter render and a clearer read; the outline carries
                    sequencing. RunCard, collapseRuns and EventList-in-centre are deleted. (3) The paste
                    INPUT becomes the leftmost narrow panel and shows the PRETTIFIED source in place, so
                    the separate right-hand source pane (@p6hw4k's dual-pane) is gone: raw in, prettified
                    below, one artifact. Layout is now three columns — input | outline | one event — with
                    no dock row. Accepted tradeoff: losing at-a-glance multi-event scanning in the centre
                    (the outline replaces it) and prettifying the source eagerly rather than on toggle
                    (memoised + deferred + progressively rendered, so @v3mk7n's freeze stays bounded).

                Token-driven light + dark themes = decision:
                  id: t7hm4k
                  why: >
                    Every color is a CSS custom-property TOKEN (surfaces, text, accents, shadow), so a
                    whole theme is one swap: DARK is the :root default and :root[data-theme='light']
                    overrides the tokens. A header ThemeToggle flips `data-theme` on <html> and persists
                    the choice to localStorage (dark default). Value-tinted chrome — the ilk badge border,
                    the warn chip, the ambient body glow — derives from its own color via
                    color-mix(currentColor | accent, transparent) rather than hardcoded hexes, so it
                    adapts to either theme with no per-theme rules. Accepted tradeoff: light accents are
                    hand-tuned darker variants (not a computed inversion), and a returning light-theme
                    user sees a brief first-paint flash because the toggle applies in an effect — left for
                    a pre-paint inline set if it ever matters.

                System preference is the default theme; an explicit choice persists = decision:
                  id: s7prf4
                  why: >
                    Supersedes t7hm4k's hardcoded "dark default": the app should open in the visitor's
                    OWN preferred mode, not assume dark. The default now RESOLVES from the OS/browser via
                    prefers-color-scheme (window.matchMedia), falling back to dark only when the
                    environment reports nothing. Consequently localStorage holds a theme ONLY after the
                    user explicitly clicks the toggle — persisting on mount (as t7hm4k did) would freeze
                    the resolved value into a fake "choice" and the app could never track the OS. An
                    unchosen visitor therefore follows their OS LIVE (a matchMedia 'change' listener
                    reswaps the palette until they pick); a chooser's pick sticks and overrides the OS.
                    This forced resolving the first-paint flash t7hm4k deferred: because the default can
                    now be light, a dark→light flash would be visible, so a tiny blocking inline script in
                    index.html sets data-theme from the same stored-else-system resolution BEFORE React
                    mounts; savedTheme() shares that logic so script and React agree on the first paint.
                    Accepted tradeoffs: an explicit choice is sticky with no in-UI "back to auto" (clearing
                    localStorage is the escape hatch — rule of three before adding a tri-state control),
                    and the inline script duplicates ~4 lines of resolution in plain JS to stay
                    dependency- and paint-order-correct.

                Realize the inspector visual design; a deterministic glyph stands in for entviz = decision:
                  id: d4nk7v
                  why: >
                    The components were shipped functionally correct but UNSTYLED, which read as
                    generic and ugly — far from the jwt.io-grade inspector the design targets; the owner
                    flagged that the visualization IS the product, not later polish. Realized the visual
                    design from the bake-off winner design/1-inspector.html: a dark IDE-inspector design
                    system (CSS custom properties for the palette, JetBrains Mono / IBM Plex Sans type),
                    the three-region shell (@t2vd6m: a header with stream stats and integrity chips, a
                    left outline+identifier rail, the panes, a bottom annotation dock), event CARDS with
                    color-coded ilk badges, striped collapsible PROOF blocks (@v3nk7t
                    statement-over-proof), and field-key→value rows with per-type value color.
                    High-entropy values render as entviz-style PILLS whose PRIMARY identity cue is a
                    deterministic FINGERPRINT GLYPH (@v7kd3m: the glyph, not color, carries sameness),
                    with color demoted to a small CVD-safe CATEGORICAL bucket plus a role label — NOT
                    the per-identifier hue the prototype used, which the UX critique proved collides and
                    fails colorblind users at 80 identifiers. The glyph is a cesrview-owned
                    deterministic stand-in until the enhanced entviz pill is integrated (~2o7m /
                    @g4mp2w). Keyboard and focus-visible a11y (@f6tk4p) carry over from the components as
                    built. Rejected matching the prototype's color scheme literally (unsound per
                    @v7kd3m) and continuing to defer styling as polish (the visualization is the value).
                    Accepted tradeoff: a hand-authored design system and a stand-in glyph to swap out
                    when entviz lands.

                Adopt entviz pills in corpus posture; replace the stand-in glyph = decision:
                  id: e5vk7n
                  why: >
                    The hand-rolled fingerprint glyph plus color bucket (@d4nk7v's stand-in for
                    @g2hd6n / @g4mp2w) was always temporary, and it did the very thing the entviz
                    security model forbids: it invited a same-glyph-or-color ⇒ same-value EQUALITY
                    judgement by eye (the @v7kd3m failure). entviz has settled, so cesrview now CONSUMES
                    @entviz/react's <EntvizPill> and <Entviz>, driven by @entviz/core's characterize()
                    and render(): the pill identifies each value's encoding / scheme / ROLE (key,
                    signature, digest, address, identifier) from a structured characterization —
                    replacing the crude roleOfPrimitive guess — and renders the certified comparable
                    diagram. A pasted CESR stream is a single-origin CORPUS (entviz's own example is "a
                    KERI KEL from the user's own machine"), so every stream pill references one shared
                    TrustAssumption { posture: "corpus", mnemonic, icon, autoColor }, enabling the
                    recognition aids — a short mnemonic that keeps a scannable value form visible, a
                    colorbar icon, and an auto-color tint — that make RECURRENCE scannable: the sound
                    form of the passive cross-reference @c5nzr4 wanted. Cross-reference SELECTION drives
                    the pill's host-controlled `highlight` from actual value equality (not eyeballing);
                    true cross-origin verification routes through entviz's compare flow (<EntvizCompare>
                    / <EntvizWalk>), the honest home for "are these the same?" that @b6zx2d demands.
                    Resolves @g4mp2w by CONSUMPTION rather than extension — entviz already provides
                    per-value color/shape recognition in corpus posture, so cesrview neither forks nor
                    extends it (and any gap found is raised as a PR against entviz-js, maintained
                    in-house). Deletes the stand-in Fingerprint / fingerprint modules; Vite and Vitest
                    consume entviz's raw-TypeScript packages with no bundler config (verified). Refines
                    @v7kd3m (recognition is not verification, enforced by the posture gate) and @g2hd6n.
                    Accepted tradeoff: two runtime dependencies (@entviz/react + @entviz/core, whose only
                    dep is the audited @noble/hashes) and coupling the pill UI to entviz's release
                    cadence — justified because entviz is maintained in-house and is the whole point of
                    the identifier-legibility design.
                  children:
                    Integration landed — StreamPill is the one trust point; the locate gap becomes an entviz-js PR = decision:
                      id: p7lk3n
                      why: >
                        The @e5vk7n adoption is now IMPLEMENTED. cesrview's wrapper around <EntvizPill> is
                        named StreamPill (not the earlier generic ValueChip) to make its job legible: it is
                        the SINGLE place that applies the one auditable corpus TrustAssumption (@e5vk7n) to
                        every value in a pasted stream, wires cross-reference highlight, and focuses the
                        dock — one greppable trust-application point, never a per-call posture. Two
                        consequences of consuming entviz's raw-TypeScript surface under cesrview's strict
                        `tsc --noEmit` build gate: (1) cesrview now requires @entviz >= 0.15.3 — the raw .ts
                        is part of cesrview's own typecheck, so entviz must itself be strict-typecheck-clean
                        (0.15.1 added the pill trust/typeSignal/highlight API; 0.15.2–0.15.3 cleared the
                        type and dead-code errors cesrview's noUnusedLocals/Parameters surfaced), hardening
                        @e5vk7n's accepted release-cadence coupling from a note into a version floor.
                        (2) The gap @e5vk7n anticipated has appeared concretely: <EntvizPill> has NO
                        first-class locate/select callback — a click only toggles its expand popover — so
                        cross-reference SELECTION is piggybacked on onOpenChange(open) as an interim. Per
                        @e5vk7n ("any gap found is raised as a PR against entviz-js"), the honest fix is a PR
                        adding a first-class onLocate / find-occurrences affordance to EntvizPill (a callback
                        plus a "find other occurrences" popover action) — the in-corpus companion to the
                        recognition aids, distinct from the verification compare flow (@b6zx2d / @v7kd3m).
                        RESOLVED: entviz 0.15.4 shipped the onLocate affordance (entviz-js this.i
                        lc4ktz6n), and cesrview now uses it — cross-reference selection is a DELIBERATE
                        locate act ("Find other occurrences…"), no longer an incidental side effect of
                        expanding the pill; the interim onOpenChange piggyback is retired (tick 6tnb off).

                Printed output is scoped, single-component, and reuses the screen render = decision:
                  nid: 3p4cnyq7
                  why: >-
                    How cesrview prints. Rejected a page-level "print the whole screen" dump (fights the deliberate, scoped-act grain of onLocate @p7lk3n / recognition-not-verification @v7kd3m) and a dedicated per-component print view (Model B, unjustified once exhibits are one event). Chose MODEL A: a print is a FILTER over the already-mounted page (JS sets data-print-scope on <html>; pure @media print CSS hides the others), so there is one render pipeline and no off-screen work. One printout = exactly ONE top-level component: the whole PRETTIFIED STREAM (source view), the whole OUTLINE (left rail), or ONE decoded event ("This event"; one event at a time; 3 events = 3 printouts). [Terminology updated d6rp2k-era: the earlier "transcript"/"manifest" metaphors were dropped for the real UI names — see p9rn5t.] Rejected multi-select / a report builder (rule of three; physical stapling covers the assembled-filing case). On paper, identity values STAY entviz pills, not expanded to full text: a grayscale probe of multisig-oobi confirmed the pill is monochrome-legible and its first4..mid4..last4 stub is constant-width, making it the only representation that is at once width-stable across primitive sizes (44-char SAID to thousands-char post-quantum), monochrome-legible, and distinct from the prettified stream. Full values live once in an optional raw-CESR appendix, not per field row. Invariants: print forces the light/paper palette regardless of data-theme; interactive-only affordances are hidden in print (the pill locate glyph) while informational glyphs stay; each printout self-identifies (exhibit: event SAID + controller AID + sn) and carries a "structure decoded, not verified" posture band (b6zx2d, @v7kd3m); structural blocks are unbreakable units. Print and mobile share only a refactored narrow single-column layer, diverging on interaction and color. Accepted tradeoffs: the trigger mechanism is left provisional (native print pegged to the exhibit, other scopes via the ~3xh2 right-click menu, a two-way door recorded separately); pagination of an over-tall event and long-primitive wrapping remain to be validated with a real page.pdf() oracle before this node's code lands.

                Print implementation: header trigger, fail-closed transcript expand = decision:
                  id: p9rn5t
                  why: >-
                    Lands the code for 3p4cnyq7 (tick 25ex). TRIGGER: since ~3xh2 (right-click menu)
                    is not built, the interim trigger is a small Print menu in the header offering the
                    three scopes {Prettified stream (source) | Outline | This event (exhibit)}; each sets data-print-scope on
                    <html> and calls window.print(). Native Ctrl+P (no menu) defaults to the EXHIBIT
                    scope — the one scope always fully in the DOM (one event), so a bare Ctrl+P is never
                    the truncation trap below. When ~3xh2 lands it can drive the same print(scope) entry
                    point and the header menu can retire (two-way door). FAIL-CLOSED PRETTIFIED STREAM
                    (scope `source`): the source view renders progressively (v3mk7n: EventList chunks,
                    only the first ~80 lines in the DOM), so printing it naively would silently emit a
                    truncated stream — misrepresenting completeness, a fail-closed violation. So a
                    `source` print runs a TWO-COMMIT sequence: commit 1 forces EventList to expand ALL
                    doc.lines into the DOM; only after that commit does an effect call window.print().
                    The outline (LeftRail maps every message directly) and exhibit (one event) need no
                    expansion. NAMING: the printable things use their real UI names — `source` = the
                    prettified stream (the input panel's unlabeled Source view), `outline` = the left
                    rail, `exhibit` = one decoded event ("This event"); the earlier "transcript"/
                    "manifest" metaphors were dropped. POSTURE + SELF-ID:
                    reuse the header's existing "structure only · not cryptographically verified" chip
                    (b6zx2d) — kept visible in print — plus the brand and stream kind, to satisfy the
                    posture-band + self-identification invariants cheaply. @media print keys off
                    data-print-scope to hide the two non-selected regions, force the light/paper palette
                    regardless of data-theme, hide interactive chrome, wrap the source, and set
                    break-inside:avoid. Accepted tradeoffs / DEFERRED (two-way doors, not blocking a
                    first community-shareable print): a dedicated per-exhibit SAID+AID+sn self-id band
                    and the optional raw-CESR appendix (the event card already shows the SAID); hiding
                    the entviz pill locate glyph (entviz-internal DOM, not reliably targetable — the
                    glyph is low-harm on paper); and the shared-narrow-layer refactor with mobile — print
                    CSS is kept SELF-CONTAINED rather than coupled to the currently-untested mobile layer
                    (coupling two unproven layouts to "prevent drift" would risk both; revisit once mobile
                    is validated). Pagination of an over-tall event is validated with the vendored
                    page.pdf() probe (docs/print/), NOT CI — jsdom has no layout engine, so the @media
                    print CSS is proven by the probe oracle while the trigger/expand LOGIC is unit-tested
                    to 100% branch.

                Drag-and-drop a file onto the input loads it as the stream = decision:
                  id: d6rp2k
                  why: >-
                    A third load path beside paste and type: the input panel accepts a file DROP
                    (dragover highlights the panel). The FIRST dropped file is read as TEXT and REPLACES
                    the textarea contents (a file-load semantic, not append), then flows through the
                    SAME decode pipeline — no new parsing path. Read-as-text matches the app's existing
                    text-only model (textarea + TextEncoder); a genuinely binary CESR file would be
                    mangled — accepted limitation, since paste/type already assume text and the sample
                    corpus is text (a binary-aware path can come later if a real need appears). Guard:
                    only file drags are hijacked (dataTransfer.types includes 'Files'); a text/selection
                    drag is left to the browser's default. Multiple files: FIRST only (rule of three; one
                    stream at a time). Not restricted by extension — any dropped text is decoded and the
                    existing parse-error path handles non-CESR input, fail-safe. Encapsulated in a
                    useFileDrop hook so the guard/first-file/read-as-text branches are unit-tested to
                    100% independent of layout.
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
          children:
            Support CBOR and MGPK bodies via pluggable, injectable decoders = decision:
              id: s7bk4m
              why: >
                Landed the CBOR/MGPK support @c4nk7p anticipated ("not to CBOR/MGPK once their
                sniff/table support lands"), reconciling @s4hd6q's fail-closed stance: a non-JSON body
                is now SUPPORTED when a decoder is available and FRAMED-BUT-UNDECODED — not a hard
                failure — when it is not. signify-ts ships no CBOR or MGPK decoder (verified: its deps
                are crypto/base64/mathjs only), so rather than hard-wire cbor/msgpack into the walker
                and break its signify-ts-only boundary (@n6wd3k), body decoding is PLUGGABLE:
                walk(bytes, { decoders }) takes a map from serialization kind to a decode function.
                JSON is built in (a language builtin, no dependency); CBOR and MGPK live in an OPTIONAL
                src/cesr/decoders module that imports cbor-x and @msgpack/msgpack and is NEVER imported
                by the core walker. A consumer of the walker or the eventual React components (@r4vkp7)
                thus PICKS its dependency weight: import nothing and get JSON plus frame-only handling
                of CBOR/MGPK; inject the decoders and get full field decode. The version string is now
                found as a BARE token anywhere in the leading window (every serialization carries it as
                ASCII, even inside binary CBOR/MGPK) rather than requiring JSON "v":"..." syntax — this
                both generalises detection and mirrors how keripy's own Rever locates it. When no
                decoder handles a body, `sad` is null and ilk/sn/said are null: a refinement of
                @m4dp7k's contract (sad was always an object) that keeps the never-throw, three-state
                spirit of @d3rk6n. Grounded by keripy-transcoded fixtures (the JSON tiny-kel
                re-serialised to CBOR and MGPK with attachments carried over) and verified that cbor-x
                and @msgpack/msgpack decode keripy's output field-for-field. Rejected hard-wiring the
                decoders into the core (breaks @n6wd3k, forces the dependency on every consumer) and
                frame-only-forever (leaves the decoded view unable to show non-JSON fields). @n6wd3k
                HOLDS for the core, which stays signify-ts-only; the optional decoders module carries
                its own deps and becomes part of the separate serialization package at extraction time
                (@r4vkp7). Accepted tradeoff: two small dependencies in the repo, used only by the
                optional module, and a decoder-injection seam through walk().

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

            ParseError carries a stable code and states its permanence = decision:
              id: n4kr7p
              why: >
                The walker's ParseError originally carried only a prose `message` and a byte span,
                which fails the two load-bearing axes of the Bakobo error-handling standard — a STABLE
                SYMBOLIC CODE and PERMANENT-vs-TRANSIENT — and the standard names both as findings,
                most acutely at a LIBRARY boundary, which is exactly what the walker is: a consumer
                catching WalkResult.errors could otherwise only string-match prose to tell one failure
                from another. Added a ParseErrorCode union (not-a-message, no-version-string,
                malformed-body, unparseable-counter, unframable-group) so callers branch on KIND, and
                permanent: true because the walker is PURE and DETERMINISTIC — the same bytes always
                fail the same way, so retrying never helps; the standard's "assess, don't assume" holds
                that deterministic code is permanent by nature and must STATE it rather than imply a
                pointless retry. The messages stay DEVELOPER-facing complete sentences that name what
                broke and where; per the standard's two-audiences rule any warm user-facing translation
                belongs in the UI layer above, not in this bounded module. Rejected leaving errors
                prose-only (fails the standard, and cost-shifts diagnosis onto every consumer) and
                adding a transient/retryable variant (the walker performs no I/O, so nothing it does is
                transient). Refines @d3rk6n's typed-error model and @m4dp7k's output contract. Accepted
                tradeoff: a code union to keep in step with the error sites.

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
            deterministic entviz fingerprint AND accent color, so correlation is always-on and needs
            no interaction (scales to hundreds of events with zero clutter); (2) ACTIVE — selecting an
            identifier highlights all its occurrences and offers jump-to-establishment and next/prev,
            the IDE "find all references" pattern; (3) GUTTER reference marks showing forward/back
            references without drawing a full graph. Separately adopt rainbow-matched delimiters for
            counter-group / JSON nesting legibility. Rejected the canvas's drawn-line web (doesn't
            scale, breaks sequence). Accepted tradeoff: more rendering machinery than a plain tree,
            and a dependency on per-identifier color support in entviz (@g4mp2w).

        Extend entviz for per-identifier color, upstreamed = decision:
          id: g4mp2w
          why: >
            The passive cross-ref layer (@c5nzr4) needs each identifier pill to carry a deterministic
            per-identifier background/accent color, which the published @entviz/react may not yet
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

        Color cannot be the cross-reference invariant = tension:
          id: v7kd3m
          why: >
            Fresh-context adversarial review found the passive cross-reference layer's reliance on
            per-identifier COLOUR (@c5nzr4, @g4mp2w) unsound: hue = hash mod 360 collides badly across
            the ~2100 distinct high-entropy tokens a real stream carries, fails for colorblind users,
            and is illegible at a 15px swatch. Color cannot be the sameness invariant.
          resolution: >
            The deterministic entviz FINGERPRINT glyph is the sameness invariant; per-value color
            becomes secondary/decorative. Cross-referencing (passive same-fingerprint, active
            find-all-references, gutter marks) applies to ALL high-entropy values — the owner REBUTS
            the reviewers' "pills for AIDs only", because entviz visualises entropy of any kind
            (identifiers, keys, digests, signatures, nonces). Value CLASSES are distinguished instead
            by pill SHAPE (e.g. rounded vs square vs angular corners), which becomes part of the entviz
            extension (@g4mp2w) alongside or instead of the color work.

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

        Source pane is a lighter custom virtualized pane, not CodeMirror = tension:
          id: s5kn7w
          why: >
            @p6hw4k chose a read-only CodeMirror 6 source pane and @p4rz6b affirmed "CodeMirror stands".
            Building it surfaced three problems with CM6 here: the pane is READ-ONLY (its edit
            machinery is unused), CM6 is a heavy multi-package dependency that cuts against @r4vkp7's
            "consumers pick their dependency weight", and — decisively for this repo — CM6 is very hard
            to test to the 100%-branch coverage bar because it needs layout and measurement DOM APIs
            jsdom does not implement. Confirmed with the owner.
          resolution: >
            The source pane is a LIGHTER, hand-rolled pretty-print pane (plain DOM plus windowing), not
            CodeMirror: it gives the user-facing read tooling that mattered — line numbers, copy,
            keyboard navigation, and byte<->node span mapping — while staying jsdom-testable and
            dependency-light. Stream-wide search-highlight-all (a real CM6 win) is deferred, and CM6
            remains a future upgrade if advanced text tooling is demanded. Everything else in @p6hw4k
            and @p4rz6b HOLDS: the dual-pane split, the READ-ONLY source, the cesrview PRETTY-PRINTED
            content, virtualization of large panes, and selection sync as the teaching moment — only
            CodeMirror the MECHANISM is replaced. The pretty printer is a pure tier-1 function
            prettyPrint(walkResult, bytes) -> { text, lines } emitting a newline per message body and
            per attachment group/primitive, each display line carrying its original byte span (message
            bodies map coarsely to the whole body span, since the walker does not split JSON fields;
            attachments map finely). Built in slices: 3a is the pretty printer plus the pane plus the
            dual-pane layout, rendering all lines; virtualization and 3b's byte<->node selection sync
            (a selectedSpan on the CesrView context) follow. Accepted tradeoff: we hand-roll the pane
            and defer search and (initially) virtualization instead of inheriting CM6's.

        Decoded view is primary; the source pane is a collapsed secondary panel = tension:
          id: m7kv3n
          why: >
            @p6hw4k / @p4rz6b / @t2vd6m framed the source and decoded panes as CO-EQUAL halves of a
            dual pane. In use the owner found the two largely REDUNDANT, with the decoded tree
            significantly more useful than the pretty-printed source — a co-equal split wastes the most
            valuable horizontal space and doubles the initial render (a real cost: a large paste froze
            the UI ~15s). Separately the owner found the layout never went vertical on narrow viewports
            despite @t2vd6m promising desktop-first RESPONSIVE.
          resolution: >
            The DECODED tree is the primary, always-visible centre panel; the SOURCE pane is demoted to
            a secondary panel COLLAPSED BY DEFAULT (a toggle reveals it) and rendered LAZILY — only when
            opened — so the pretty-print and its lines are neither computed nor mounted on first paint.
            Dual-pane and the pretty-printed, provenance-carrying source still STAND (@p6hw4k / @p4rz6b
            / @s5kn7w hold, and 3b's selection sync will light the source up) — it is simply one toggle
            away, not co-equal. Also delivers @t2vd6m's stated-but-missing responsive behaviour: the
            columns stack to a single vertical column on narrow (mobile) viewports. The KEL sequence is
            NEVER grouped or hidden — the outline stays in STREAM ORDER (the arrival sequence is
            load-bearing, @m3xq7c / @k2vx5n); it is only ENRICHED with a per-event owning-identifier
            glyph and an explicit hex sn label so interleaved per-identifier sequences read correctly.
            Accepted tradeoff: the source is one interaction away instead of always present.

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
          children:
            Model the stream as labelled KEL/TEL logs plus loose messages = decision:
              id: w3rn6k
              why: >
                Realized @k2vx5n as a cesrview-side model (src/model) over the walker's WalkResult, NOT
                inside the walker, keeping that a generic upstreamable decomposition (@m4dp7k, @n6wd3k).
                organize() groups every sequenced event into an EventLog by owning AID (the `i` field),
                ordered by NUMERIC sequence number (sn parsed from hex, so lane order is 9, a, ..., 10
                and not lexical), and surfaces per-log gaps (missing sn) and duplicities (more than one
                event at one sn) as @k2vx5n requires. Each log is LABELLED kind KEL or TEL from its
                event ilks (KEL: icp/rot/ixn/dip/drt; TEL: vcp/vrt/iss/rev/bis/brv) rather than lumped
                under one uber name — the owner asked for the distinction, and it is reliable because
                the two ilk sets are disjoint and a log's events are homogeneous. Classifying by ILK
                (not merely by the presence of i and s) is also what keeps ACDCs out of the logs: an
                ACDC has a string `s` that is a SCHEMA SAID, not a sequence number (verified in the
                corpus), so a naive i+s test would misfile it as a log event — only a message whose `t`
                is a known KEL/TEL ilk becomes a log event. Everything else (rpy, exn, ACDC bodies,
                receipts) is a LOOSE message retained in STREAM order — the owner's choice over
                cross-referencing loose replies to a subject AID, which is deferred. Delegation is
                surfaced as an edge: a log's delegator is the `di` on its inception event, or null.
                Stream order is preserved via a streamIndex on every event and loose message, so both
                the by-owner and stream-order views (@k2vx5n) are reconstructable without duplicating
                the message list. Rejected putting this in the walker (KERI/TEL semantics do not belong
                in the generic framer) and an uber EventLog with no kind label (loses the KEL/TEL
                distinction). Accepted tradeoff: the model hard-codes the v1 KEL/TEL ilk vocabulary,
                which lives in cesrview until any of it is needed upstream.

            Collapse consecutive same-owner interaction runs in place, expandable = decision:
              id: r6nk2w
              why: >
                Real KELs contain long runs of homogeneous interaction (ixn) events — the sample has
                one owner with 69 consecutive ixn — and rendering every one as a full card is a
                dominant cost of the ~15s freeze on a large paste and buries the interesting
                establishment events in noise. Chose to COLLAPSE a maximal run of 3 or more CONSECUTIVE
                same-owner ixn events into a single "N interaction events, sn a–b" card, EXPANDABLE IN
                PLACE to reveal every event at its exact stream position. The sequence is never
                reordered, grouped across owners, or hidden — a collapsed run is one click from full
                expansion and shows its sn span, honouring @m3xq7c / @k2vx5n (arrival order is
                load-bearing). It is a pure display transform (collapseRuns over the stream-order
                messages), matching the bake-off prototype's run card. Rejected collapsing across
                owners or across non-ixn events (would fold semantically distinct events) and a fixed
                page/limit (hides the tail silently). Accepted tradeoff: expanding a very long run still
                renders all its cards until list virtualization (the next increment) makes even that
                cheap, and jumping to an event inside a collapsed run is a no-op until the outline
                learns to expand it (tracked).

            Decoded list renders progressively in chunks, not measured windowing = decision:
              id: v3mk7n
              why: >
                Even with run-collapse (@r6nk2w) a large stream can render hundreds of variable-height
                cards at once — the residual cause of the paste freeze. Chose PROGRESSIVE chunked
                rendering: the decoded list shows the first ~40 items and reveals the next chunk as its
                container is scrolled toward the end, bounding the INITIAL paint (what actually froze)
                without ever dropping an event. Rejected measured/windowed virtualization (render only
                the rows in view) for the same reason CodeMirror was rejected (@s5kn7w): it needs
                layout/measurement DOM APIs jsdom does not implement, so it cannot be tested to the
                100%-branch bar, and variable-height cards make the height bookkeeping fragile; a
                virtualization dependency trades that for weight against @r4vkp7. Progressive rendering
                stays pure and jsdom-testable. Accepted tradeoff: memory still grows as you scroll a
                very large stream (scrolled-past items stay mounted) — true windowing remains a future
                option if a stream large enough to need it appears; @r6nk2w plus this remove the freeze
                at the corpus scale we have.

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
