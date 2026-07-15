import type { ReactNode } from 'react';

/** The dual-pane layout: the read-only source pane on the left, the decoded tree on the right
 * (decisions p6hw4k / t2vd6m). Selection sync between the two arrives in 3b. */
export function DualPane({ source, decoded }: { source: ReactNode; decoded: ReactNode }) {
  return (
    <div className="cesr-dualpane">
      <div className="cesr-pane cesr-pane-source">{source}</div>
      <div className="cesr-pane cesr-pane-decoded">{decoded}</div>
    </div>
  );
}
