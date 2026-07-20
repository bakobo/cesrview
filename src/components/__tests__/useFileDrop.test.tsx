import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useFileDrop } from '../useFileDrop';

/** A harness that spreads the hook's drop props onto a zone and exposes the dragging flag. */
function Harness({ onText }: { onText: (t: string) => void }) {
  const { dragging, dropProps } = useFileDrop(onText);
  return (
    <div data-testid="zone" data-dragging={dragging} {...dropProps}>
      drop here
    </div>
  );
}

const fileDrag = (files: File[]) => ({
  dataTransfer: { types: ['Files'], files },
});

describe('useFileDrop', () => {
  it('highlights while a FILE is dragged over, and clears on leave', () => {
    render(<Harness onText={() => {}} />);
    const zone = screen.getByTestId('zone');
    fireEvent.dragOver(zone, fileDrag([]));
    expect(zone).toHaveAttribute('data-dragging', 'true');
    fireEvent.dragLeave(zone);
    expect(zone).toHaveAttribute('data-dragging', 'false');
  });

  it('ignores a non-file drag (e.g. selected text), leaving it to the browser', () => {
    render(<Harness onText={() => {}} />);
    const zone = screen.getByTestId('zone');
    fireEvent.dragOver(zone, { dataTransfer: { types: ['text/plain'], files: [] } });
    expect(zone).toHaveAttribute('data-dragging', 'false');
  });

  it('reads the first dropped file as text and reports it, clearing the highlight', async () => {
    const onText = vi.fn();
    render(<Harness onText={onText} />);
    const zone = screen.getByTestId('zone');
    fireEvent.dragOver(zone, fileDrag([]));
    const file = new File(['-CESR-STREAM-'], 'kel.cesr', { type: 'text/plain' });
    const other = new File(['second'], 'other.cesr', { type: 'text/plain' });
    fireEvent.drop(zone, fileDrag([file, other]));
    await waitFor(() => expect(onText).toHaveBeenCalledWith('-CESR-STREAM-'));
    expect(onText).toHaveBeenCalledTimes(1); // first file only
    expect(zone).toHaveAttribute('data-dragging', 'false');
  });

  it('is a no-op when a drop carries no files', () => {
    const onText = vi.fn();
    render(<Harness onText={onText} />);
    const zone = screen.getByTestId('zone');
    fireEvent.drop(zone, { dataTransfer: { types: [], files: [] } });
    expect(onText).not.toHaveBeenCalled();
  });
});
