import { annotate, type CodeCategory } from '../annotate/codes';
import { useAnnotationFocus, type FocusTarget } from './CesrView';

const KIND_LABEL: Record<CodeCategory, string> = {
  counter: 'counter code · group',
  matter: 'primitive code',
  indexer: 'indexed primitive code',
  ilk: 'message type',
};

/** The bottom annotation dock: the teaching surface (w6ph4k). Reflects what was last clicked — a
 * code/ilk shows its gloss and a spec link; a bare identifier shows its value. */
export function AnnotationDock() {
  const { focused } = useAnnotationFocus();
  return (
    <aside className="cesr-dock" role="region" aria-label="Annotation">
      {focused === null ? (
        <p className="dock-empty">Click a code, identifier, or message type to see what it means and jump to the spec.</p>
      ) : focused.kind === 'code' ? (
        <CodeCard target={focused} />
      ) : (
        <ValueCard value={focused.value} />
      )}
    </aside>
  );
}

function CodeCard({ target }: { target: Extract<FocusTarget, { kind: 'code' }> }) {
  const ann = annotate(target.category, target.code);
  return (
    <div className="dock-card">
      <div className="dock-title mono">{target.code}</div>
      <div className="dock-kind">{KIND_LABEL[target.category]}</div>
      {ann ? <p className="dock-gloss">{ann.gloss}</p> : <p className="dock-gloss dim">Not annotated yet.</p>}
      {target.value ? <div className="dock-value mono">{target.value}</div> : null}
      {ann ? (
        <a className="dock-spec" href={ann.spec} target="_blank" rel="noreferrer">
          Read in the spec ↗
        </a>
      ) : null}
    </div>
  );
}

function ValueCard({ value }: { value: string }) {
  return (
    <div className="dock-card">
      <div className="dock-title">identifier</div>
      <div className="dock-value mono">{value}</div>
    </div>
  );
}
