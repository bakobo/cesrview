import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AttachmentGroup } from '../AttachmentGroup';
import type { AttachmentGroup as GroupNode, Primitive } from '../../cesr/types';

const bytes = new TextEncoder().encode('SIGVALUE');
const prim: Primitive = { kind: 'primitive', code: 'A', class: 'indexer', span: { start: 0, end: 8 } };
const group = (over: Partial<GroupNode> = {}): GroupNode => ({
  kind: 'group',
  code: '-A',
  count: 1,
  state: 'known',
  span: { start: 0, end: 8 },
  items: [prim],
  ...over,
});

describe('AttachmentGroup', () => {
  it('renders the code, count and gloss', () => {
    render(<AttachmentGroup node={group()} bytes={bytes} />);
    expect(screen.getByText('-A')).toBeInTheDocument();
    expect(screen.getByText('×1')).toBeInTheDocument();
    expect(screen.getByText(/controller indexed signatures/i)).toBeInTheDocument();
  });

  it('shows its children when open and hides them when toggled', () => {
    render(<AttachmentGroup node={group()} bytes={bytes} />);
    expect(screen.getByText('SIGVALUE')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { expanded: true }));
    expect(screen.queryByText('SIGVALUE')).not.toBeInTheDocument();
  });

  it('recurses into nested groups', () => {
    const wrapper = group({ code: '-V', items: [group()] });
    render(<AttachmentGroup node={wrapper} bytes={bytes} />);
    expect(screen.getByText('-V')).toBeInTheDocument();
    expect(screen.getByText('-A')).toBeInTheDocument(); // nested group
    expect(screen.getByText('SIGVALUE')).toBeInTheDocument(); // deepest primitive
  });

  it('renders without a gloss for an unannotated counter code', () => {
    render(<AttachmentGroup node={group({ code: '-ZZ' })} bytes={bytes} />);
    expect(screen.getByText('-ZZ')).toBeInTheDocument();
    expect(screen.queryByText(/controller indexed signatures/i)).not.toBeInTheDocument();
  });
});
