import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LeftRail } from '../LeftRail';
import { CesrViewProvider } from '../CesrView';
import type { CesrMessage } from '../../cesr/types';
import type { EventLog } from '../../model/stream';

const AID = 'EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2';
const msg = (over: Partial<CesrMessage>): CesrMessage => ({
  proto: 'KERI', version: '1.0', kind: 'JSON', ilk: 'icp', sn: '0', said: AID, sad: {}, span: { start: 0, end: 0 }, attachments: [], ...over,
});
const messages = [msg({ ilk: 'icp', sn: '0' }), msg({ ilk: 'ixn', sn: '1' })];
const logs: EventLog[] = [{ aid: AID, kind: 'KEL', events: [], delegator: null, gaps: [], duplicities: [] }];

describe('LeftRail', () => {
  it('lists events in the outline and jumps on click', () => {
    const onGo = vi.fn();
    render(
      <CesrViewProvider>
        <LeftRail messages={messages} logs={logs} onGo={onGo} />
      </CesrViewProvider>,
    );
    fireEvent.click(screen.getByRole('button', { name: /event 0: icp/i }));
    expect(onGo).toHaveBeenCalledWith(0);
    expect(screen.getByRole('button', { name: /event 1: ixn/i })).toBeInTheDocument();
  });

  it('indexes the owning identifiers as pills', () => {
    render(
      <CesrViewProvider>
        <LeftRail messages={messages} logs={logs} onGo={vi.fn()} />
      </CesrViewProvider>,
    );
    expect(screen.getByText(/identifiers · 1/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: AID })).toHaveAttribute('data-value', AID);
  });

  it('falls back to the serialization kind for a message with no ilk or sn', () => {
    render(
      <CesrViewProvider>
        <LeftRail messages={[msg({ ilk: null, sn: null })]} logs={logs} onGo={vi.fn()} />
      </CesrViewProvider>,
    );
    expect(screen.getByRole('button', { name: 'event 0: JSON' })).toBeInTheDocument();
  });
});
