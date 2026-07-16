import type { AttachmentGroup as GroupNode, CesrMessage, Primitive } from './cesr/types';
import { CesrViewProvider } from './components/CesrView';
import { PrimitiveChip } from './components/PrimitiveChip';
import { StreamPill } from './components/StreamPill';
import { SadValue } from './components/SadValue';
import { AttachmentGroup } from './components/AttachmentGroup';
import { DecodedEvent } from './components/DecodedEvent';

/* A dependency-free showcase of the tier-2 components in isolation, each with representative props,
 * all inside one CesrViewProvider so cross-referencing works across the page (click any identifier).
 * Reached at /#gallery (see main.tsx). Not part of the product view. */

const AID = 'EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2'; // 44-char AID
const bytes = new TextEncoder().encode(AID + 'A'.repeat(88)); // AID then an 88-char signature

const aidPrim: Primitive = { kind: 'primitive', code: 'E', class: 'matter', span: { start: 0, end: 44 } };
const sigPrim: Primitive = { kind: 'primitive', code: 'A', class: 'indexer', span: { start: 44, end: 132 } };
const aGroup: GroupNode = { kind: 'group', code: '-A', count: 1, state: 'known', span: { start: 40, end: 132 }, items: [sigPrim] };
const vGroup: GroupNode = { kind: 'group', code: '-V', count: 23, state: 'known', span: { start: 36, end: 132 }, items: [aGroup] };

const event: CesrMessage = {
  proto: 'KERI',
  version: '1.0',
  kind: 'JSON',
  ilk: 'icp',
  sn: '0',
  said: AID,
  sad: { t: 'icp', s: '0', d: AID, i: AID, kt: '1', k: [AID] },
  span: { start: 0, end: 44 },
  attachments: [vGroup],
};
const undecodedEvent: CesrMessage = {
  proto: 'KERI',
  version: '1.0',
  kind: 'CBOR',
  ilk: null,
  sn: null,
  said: null,
  sad: null,
  span: { start: 0, end: 60 },
  attachments: [],
};

export default function Gallery() {
  return (
    <main className="cesr-gallery">
      <h1>cesrview component gallery</h1>
      <CesrViewProvider>
        <section>
          <h2>PrimitiveChip</h2>
          <PrimitiveChip node={aidPrim} bytes={bytes} />
          <PrimitiveChip node={sigPrim} bytes={bytes} />
        </section>
        <section>
          <h2>StreamPill</h2>
          <StreamPill value={AID} label="an AID" />
        </section>
        <section>
          <h2>SadValue</h2>
          <SadValue value={AID} /> <SadValue value="1/3" /> <SadValue value={[AID, AID]} />
        </section>
        <section>
          <h2>AttachmentGroup</h2>
          <AttachmentGroup node={vGroup} bytes={bytes} />
        </section>
        <section>
          <h2>DecodedEvent</h2>
          <DecodedEvent message={event} bytes={bytes} />
          <DecodedEvent message={undecodedEvent} bytes={bytes} />
        </section>
      </CesrViewProvider>
    </main>
  );
}
