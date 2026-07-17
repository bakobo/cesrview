import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LeftRail } from '../LeftRail';
import { CesrViewProvider } from '../CesrView';
import type { CesrMessage } from '../../cesr/types';
import type { EventLog } from '../../model/stream';

const AID = 'EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2';
const msg = (over: Partial<CesrMessage>): CesrMessage => ({
  proto: 'KERI', version: '1.0', kind: 'JSON', ilk: 'icp', sn: '0', said: AID, sad: { i: AID }, span: { start: 0, end: 0 }, attachments: [], ...over,
});
const messages = [msg({ ilk: 'icp', sn: '0' }), msg({ ilk: 'ixn', sn: 'a' })]; // hex sn
const logs: EventLog[] = [{ aid: AID, kind: 'KEL', events: [], delegator: null, gaps: [], duplicities: [] }];

describe('LeftRail', () => {
  it('lists events with a 1-based index and hex sn, a section-header pill at owner-change; jumps on click', () => {
    const onGo = vi.fn();
    const { container } = render(
      <CesrViewProvider>
        <LeftRail messages={messages} logs={logs} onGo={onGo} />
      </CesrViewProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /event 1: icp, sn 0/i })); // 1-based
    expect(onGo).toHaveBeenCalledWith(0);
    // both events share the owner AID, so ONE section-header pill precedes the run (a collapsed pill,
    // not a full entviz visualization) — never one per row
    expect(container.querySelectorAll('.rail-section').length).toBe(1);
    expect(container.querySelector(`.rail-section .cesr-pill[data-value="${AID}"]`)).toBeInTheDocument();
    // 1-based stream positions on the left, hex sn on the right
    expect(container.querySelectorAll('.toc-num')[0]).toHaveTextContent('1');
    expect(container.querySelectorAll('.toc-num')[1]).toHaveTextContent('2');
    expect(screen.getByText('sn a')).toBeInTheDocument(); // the second event's hex sn, prefixed
  });

  it('indexes the owning identifiers as pills', () => {
    const { container } = render(
      <CesrViewProvider>
        <LeftRail messages={messages} logs={logs} onGo={vi.fn()} />
      </CesrViewProvider>,
    );
    expect(screen.getByText(/identifiers · 1/i)).toBeInTheDocument();
    const pill = container.querySelector(`.rail-ids .cesr-pill[data-value="${AID}"]`);
    expect(pill).toBeInTheDocument();
    expect(pill!.querySelector('button')).toBeInTheDocument();
  });

  it('falls back to the serialization kind and omits owner/sn when a message has neither', () => {
    render(
      <CesrViewProvider>
        <LeftRail messages={[msg({ ilk: null, sn: null, sad: null })]} logs={logs} onGo={vi.fn()} />
      </CesrViewProvider>,
    );
    expect(screen.getByRole('button', { name: 'event 1: JSON' })).toBeInTheDocument();
  });
});
