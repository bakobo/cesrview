import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { SamplePicker } from '../SamplePicker';

afterEach(() => vi.restoreAllMocks());

describe('SamplePicker', () => {
  it('renders a labelled button for each curated sample', () => {
    render(<SamplePicker onLoad={() => {}} />);
    expect(screen.getByRole('button', { name: /key event log/i })).toBeInTheDocument();
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(3);
  });

  it('fetches the chosen sample and hands the loaded text to onLoad', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('CESR-TEXT', { status: 200 }));
    const onLoad = vi.fn();
    render(<SamplePicker onLoad={onLoad} />);
    fireEvent.click(screen.getByRole('button', { name: /key event log/i }));
    await waitFor(() => expect(onLoad).toHaveBeenCalledWith('CESR-TEXT'));
  });

  it('disables the buttons while a sample is loading, then re-enables them', async () => {
    let settle!: (r: Response) => void;
    vi.spyOn(globalThis, 'fetch').mockReturnValue(
      new Promise<Response>((r) => {
        settle = r;
      }),
    );
    render(<SamplePicker onLoad={() => {}} />);
    const btn = screen.getByRole('button', { name: /key event log/i });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    await waitFor(() => expect(btn).toBeDisabled());
    settle(new Response('X', { status: 200 }));
    await waitFor(() => expect(btn).not.toBeDisabled());
  });

  it('surfaces a fail-closed error and does not call onLoad when a sample cannot be loaded', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 404 }));
    const onLoad = vi.fn();
    render(<SamplePicker onLoad={onLoad} />);
    fireEvent.click(screen.getByRole('button', { name: /key event log/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/couldn.t be loaded|404/i);
    expect(onLoad).not.toHaveBeenCalled();
  });
});
