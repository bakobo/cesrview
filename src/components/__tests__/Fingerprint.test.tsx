import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Fingerprint } from '../Fingerprint';

describe('Fingerprint', () => {
  it('renders an svg of filled cells for a value', () => {
    const { container } = render(<Fingerprint value="EDP1vHcw_wc4M__Fj53-cJaBnZZASd-aMTaSyWEQ-PC2" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(container.querySelectorAll('rect').length).toBeGreaterThan(0);
  });
});
