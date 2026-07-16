import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DecodedEvent } from '../DecodedEvent';
import type { AttachmentGroup, CesrMessage, Primitive } from '../../cesr/types';

const AID = 'EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2';
const bytes = new TextEncoder().encode('AAAA');
const prim: Primitive = { kind: 'primitive', code: 'A', class: 'indexer', span: { start: 0, end: 4 } };
const aGroup: AttachmentGroup = { kind: 'group', code: '-A', count: 1, state: 'known', span: { start: 0, end: 4 }, items: [prim] };
const mk = (over: Partial<CesrMessage> = {}): CesrMessage => ({
  proto: 'KERI',
  version: '1.0',
  kind: 'JSON',
  ilk: 'icp',
  sn: '0',
  said: AID,
  sad: { t: 'icp', s: '0', d: AID, k: [AID] },
  span: { start: 0, end: 10 },
  attachments: [aGroup],
  ...over,
});

describe('DecodedEvent', () => {
  it('renders the annotated ilk and chips high-entropy statement values', () => {
    const { container } = render(<DecodedEvent message={mk()} bytes={bytes} />);
    expect(screen.getByText(/inception/i)).toBeInTheDocument(); // the ilk gloss
    expect(screen.getByText('k')).toBeInTheDocument(); // a field key
    expect(screen.getByText('0')).toBeInTheDocument(); // the sn value, as plain text
    // the SAID, the d field and the k[] element are each an AID StreamPill (value on the wrapper)
    expect(container.querySelectorAll(`.cesr-pill[data-value="${AID}"]`).length).toBeGreaterThan(1);
  });

  it('keeps the proof band collapsed by default and expands it on click', () => {
    render(<DecodedEvent message={mk()} bytes={bytes} />);
    const toggle = screen.getByRole('button', { name: /proof/i });
    expect(screen.queryByText('-A')).not.toBeInTheDocument(); // collapsed
    fireEvent.click(toggle);
    expect(screen.getByText('-A')).toBeInTheDocument(); // expanded
  });

  it('renders a present-but-unannotated ilk without a gloss (a TEL vcp)', () => {
    render(<DecodedEvent message={mk({ ilk: 'vcp', sad: { d: 'EReg' } })} bytes={bytes} />);
    expect(screen.getByText('vcp')).toBeInTheDocument();
  });

  it('renders the undecoded state for a frame-only (sad null) message', () => {
    render(<DecodedEvent message={mk({ ilk: null, sad: null, kind: 'CBOR', attachments: [] })} bytes={bytes} />);
    expect(screen.getByText(/undecoded cbor body/i)).toBeInTheDocument();
  });

  it('pluralizes the proof group count', () => {
    render(<DecodedEvent message={mk({ attachments: [aGroup, aGroup] })} bytes={bytes} />);
    expect(screen.getByRole('button', { name: /2 groups/i })).toBeInTheDocument();
  });

  it('renders no proof band when there are no attachments', () => {
    render(<DecodedEvent message={mk({ attachments: [] })} bytes={bytes} />);
    expect(screen.queryByText(/proof/i)).not.toBeInTheDocument();
  });
});
