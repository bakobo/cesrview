import { useState } from 'react';
import { annotate } from '../annotate/codes';
import type { AttachmentGroup as GroupNode } from '../cesr/types';
import { PrimitiveChip } from './PrimitiveChip';
import { SpecLink } from './SpecLink';

/** Renders a counter-framed attachment group: its code, count and gloss on a keyboard-operable
 * disclosure that also sends the counter code to the annotation dock, with its typed children
 * (nested groups and primitives) rendered recursively. */
export function AttachmentGroup({ node, bytes }: { node: GroupNode; bytes: Uint8Array }) {
  const [open, setOpen] = useState(true);
  const ann = annotate('counter', node.code, node.genus);
  return (
    <div className="cesr-group" data-code={node.code} data-state={node.state}>
      <div className="cesr-group-head">
        <button className="cesr-group-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span className="code">{node.code}</span> <span className="count">×{node.count}</span>
        </button>
        {/* The gloss IS the spec link (s9grn4): clicking the concept navigates to the spec; only the
            code+count button toggles the group — so the two affordances never compete. */}
        {ann ? <span className="gloss"><SpecLink gloss={ann.gloss} spec={ann.spec} find={ann.find} /></span> : null}
      </div>
      {open ? (
        <div className="cesr-group-items">
          {node.items.map((item, k) =>
            item.kind === 'group' ? (
              <AttachmentGroup key={k} node={item} bytes={bytes} />
            ) : (
              <PrimitiveChip key={k} node={item} bytes={bytes} />
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
