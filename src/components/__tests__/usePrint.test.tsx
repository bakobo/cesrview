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
      {(['transcript', 'manifest', 'exhibit'] as PrintScope[]).map((s) => (
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

  it('defaults to the exhibit scope and reflects it on <html> (native Ctrl+P prints the exhibit)', () => {
    render(<Harness />);
    expect(screen.getByTestId('scope')).toHaveTextContent('exhibit');
    expect(document.documentElement.dataset.printScope).toBe('exhibit');
    expect(printMock).not.toHaveBeenCalled();
  });

  it('prints the exhibit scope on demand without expanding anything', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'exhibit' }));
    expect(document.documentElement.dataset.printScope).toBe('exhibit');
    expect(screen.getByTestId('expand')).toHaveTextContent('false');
    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it('prints the manifest scope without expanding anything', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'manifest' }));
    expect(document.documentElement.dataset.printScope).toBe('manifest');
    expect(screen.getByTestId('expand')).toHaveTextContent('false');
    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it('expands ALL lines before printing the transcript (fail-closed), printing exactly once', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'transcript' }));
    expect(document.documentElement.dataset.printScope).toBe('transcript');
    expect(screen.getByTestId('expand')).toHaveTextContent('true');
    expect(printMock).toHaveBeenCalledTimes(1);
  });

  it('restores the default scope and collapses expansion after the dialog closes', () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole('button', { name: 'transcript' }));
    expect(screen.getByTestId('expand')).toHaveTextContent('true');
    act(() => {
      window.dispatchEvent(new Event('afterprint'));
    });
    expect(screen.getByTestId('scope')).toHaveTextContent('exhibit');
    expect(screen.getByTestId('expand')).toHaveTextContent('false');
  });
});
