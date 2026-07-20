import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePrint, type PrintScope } from '../usePrint';

let printMock: ReturnType<typeof vi.fn>;

/** A minimal component that exercises the hook: it surfaces the current scope + expand flag and a
 * button per scope that calls print(). */
function Harness() {
  const { scope, expandAll, print } = usePrint();
  return (
    <div>
      <span data-testid="scope">{scope}</span>
      <span data-testid="expand">{String(expandAll)}</span>
      {(['source', 'outline', 'event'] as PrintScope[]).map((s) => (
        <button key={s} onClick={() => print(s)}>
          {s}
        </button>
      ))}
    </div>
  );
}

describe('usePrint', () => {
  beforeEach(() => {
    printMock = vi.fn();
    vi.stubGlobal('print', printMock);
    delete document.documentElement.dataset.printScope;
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to the event scope and reflects it on <html> (native Ctrl+P prints the event)', () => {
    render(<Harness />);
    expect(screen.getByTestId('scope')).toHaveTextContent('event');
    expect(document.documentElement.dataset.printScope).toBe('event');
    expect(printMock).not.toHaveBeenCalled();
  });

  it('prints the event scope on demand without expanding anything', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'event' }));
    expect(document.documentElement.dataset.printScope).toBe('event');
    expect(screen.getByTestId('expand')).toHaveTextContent('false');
    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it('prints the outline scope without expanding anything', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'outline' }));
    expect(document.documentElement.dataset.printScope).toBe('outline');
    expect(screen.getByTestId('expand')).toHaveTextContent('false');
    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it('expands ALL lines before printing the prettified stream (fail-closed), printing exactly once', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'source' }));
    expect(document.documentElement.dataset.printScope).toBe('source');
    expect(screen.getByTestId('expand')).toHaveTextContent('true');
    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it('restores the default scope and collapses expansion after the dialog closes', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'source' }));
    expect(screen.getByTestId('expand')).toHaveTextContent('true');
    act(() => {
      window.dispatchEvent(new Event('afterprint'));
    });
    expect(screen.getByTestId('scope')).toHaveTextContent('event');
    expect(screen.getByTestId('expand')).toHaveTextContent('false');
  });
});
