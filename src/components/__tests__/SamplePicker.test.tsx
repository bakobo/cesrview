import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SamplePicker } from '../SamplePicker';

afterEach(() => vi.restoreAllMocks());

/** Open the "Examples" dropdown and return the trigger button. */
function openMenu() {
  const trigger = screen.getByRole('button', { name: /^examples$/i });
  fireEvent.click(trigger);
  return trigger;
}

describe('SamplePicker', () => {
  it('collapses to a single "Examples" trigger with no separate lead label (d4mx9k)', () => {
    const { container } = render(<SamplePicker onLoad={() => {}} />);
    expect(screen.getByRole('button', { name: /^examples$/i })).toBeInTheDocument();
    // the menu is closed until opened, and the old uppercase "examples" lead label is gone
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(container.querySelector('.sample-picker-lead')).toBeNull();
  });

  it('opens a menu of curated samples grouped by CESR version', () => {
    render(<SamplePicker onLoad={() => {}} />);
    const trigger = openMenu();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem').length).toBeGreaterThanOrEqual(5);
    expect(screen.getByText(/key event log/i)).toBeInTheDocument();
    // both genera are labelled as groups
    expect(screen.getByText(/CESR 1/i)).toBeInTheDocument();
    expect(screen.getByText(/CESR 2/i)).toBeInTheDocument();
  });

  it('fetches the chosen sample, hands the text to onLoad, and closes the menu', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('CESR-TEXT', { status: 200 }));
    const onLoad = vi.fn();
    render(<SamplePicker onLoad={onLoad} />);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /key event log/i }));
    await waitFor(() => expect(onLoad).toHaveBeenCalledWith('CESR-TEXT'));
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
  });

  it('disables the menu items while a sample is loading', async () => {
    let settle!: (r: Response) => void;
    vi.spyOn(globalThis, 'fetch').mockReturnValue(
      new Promise<Response>((r) => {
        settle = r;
      }),
    );
    render(<SamplePicker onLoad={() => {}} />);
    openMenu();
    const item = screen.getByRole('menuitem', { name: /key event log/i });
    expect(item).not.toBeDisabled();
    fireEvent.click(item);
    await waitFor(() => expect(item).toBeDisabled());
    settle(new Response('X', { status: 200 }));
    await waitFor(() => expect(onLoadClosed()).toBe(true));
  });

  it('surfaces a fail-closed error and does not call onLoad when a sample cannot be loaded', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 404 }));
    const onLoad = vi.fn();
    render(<SamplePicker onLoad={onLoad} />);
    openMenu();
    fireEvent.click(screen.getByRole('menuitem', { name: /key event log/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t be loaded|404/i);
    expect(onLoad).not.toHaveBeenCalled();
  });

  it('closes the menu on a second trigger click and on Escape (other keys are a no-op)', () => {
    render(<SamplePicker onLoad={() => {}} />);
    const trigger = openMenu();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'ArrowDown' }); // non-Escape: stays open
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(trigger); // toggle closed
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    openMenu();
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

/** The menu is gone once a successful load settles. */
function onLoadClosed() {
  return screen.queryByRole('menu') === null;
}
