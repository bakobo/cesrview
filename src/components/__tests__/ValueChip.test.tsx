import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ValueChip } from '../ValueChip';
import { CesrViewProvider } from '../CesrView';

const AID = 'EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2';
const OTHER = '0AAAAAAAAAAAAAAAAAAAAAAABBBBBBBBBBBBBBBBBBBB';

describe('ValueChip', () => {
  it('renders the value as a button with its provided label', () => {
    render(<ValueChip value={AID} label="prefix" />);
    const btn = screen.getByRole('button', { name: 'prefix' });
    expect(btn).toHaveAttribute('data-value', AID); // full value in data-value; display is shortened
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('does nothing when clicked outside a provider (renders standalone)', () => {
    render(<ValueChip value={AID} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    expect(btn).not.toHaveAttribute('data-selected');
  });

  it('selecting a value highlights every chip with that value, and toggles off', () => {
    render(
      <CesrViewProvider>
        <ValueChip value={AID} label="a" />
        <ValueChip value={AID} label="b" />
        <ValueChip value={OTHER} label="other" />
      </CesrViewProvider>,
    );
    const a = screen.getByRole('button', { name: 'a' });
    const b = screen.getByRole('button', { name: 'b' });
    const other = screen.getByRole('button', { name: 'other' });
    fireEvent.click(a);
    expect(a).toHaveAttribute('aria-pressed', 'true');
    expect(b).toHaveAttribute('aria-pressed', 'true'); // same value -> also highlighted
    expect(other).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(a);
    expect(a).toHaveAttribute('aria-pressed', 'false'); // toggled off
  });

  it('selects and focuses its code annotation when it has one', () => {
    render(
      <CesrViewProvider>
        <ValueChip value={AID} annotation={{ category: 'matter', code: 'E' }} />
      </CesrViewProvider>,
    );
    const btn = screen.getByRole('button', { name: AID });
    fireEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true'); // click ran select + the code-annotation path
  });
});
