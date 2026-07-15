import { useState } from 'react';
import { annotate } from '../annotate/codes';
import type { AttachmentGroup as GroupNode } from '../cesr/types';
import { PrimitiveChip } from './PrimitiveChip';

/** Renders a counter-framed attachment group: its code, count and gloss on a keyboard-operable
 * disclosure, with its typed children (nested groups and primitives) rendered recursively. */
export function AttachmentGroup({ node, bytes }: { node: GroupNode; bytes: Uint8Array }) {
  const [open, setOpen] = useState(true);
  const ann = annotate('counter', node.code);
  return (
    <div className="cesr-group" data-code={node.code} data-state={node.state}>
      <button className="cesr-group-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span className="code">{node.code}</span> <span className="count">×{node.count}</span>
        {ann ? <span className="gloss"> {ann.gloss}</span> : null}
      </button>
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
