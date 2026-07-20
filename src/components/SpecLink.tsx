import { specHref } from '../annotate/spec';

/** The gloss for a concept, rendered AS its spec deep-link (decision s9grn4). Clicking a concept
 * takes the reader to its place in the CESR/KERI spec — precisely, when the browser supports text
 * fragments (see specHref). Used for message field labels, counter/group codes, and ilks, so the
 * grounding affordance is identical everywhere and never competes with a disclosure toggle. */
export function SpecLink({ gloss, spec, find }: { gloss: string; spec: string; find?: string }) {
  return (
    <a
      className="spec-link"
      href={specHref(spec, find)}
      target="_blank"
      rel="noreferrer"
      title="Read in the spec"
    >
      {gloss} <span className="spec-arrow" aria-hidden="true">↗</span>
    </a>
  );
}
