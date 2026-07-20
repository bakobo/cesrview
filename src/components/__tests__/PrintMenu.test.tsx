import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PrintMenu } from '../PrintMenu';

describe('PrintMenu', () => {
  it('is collapsed until opened, then offers the three print scopes', () => {
    render(<PrintMenu onPrint={() => {}} />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /print/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /prettified stream/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /outline/i })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /this event/i })).toBeInTheDocument();
  });

  it.each([
    ['source', /prettified stream/i],
    ['outline', /outline/i],
    ['event', /this event/i],
  ] as const)('invokes onPrint(%s) and closes when its item is chosen', (scope, label) => {
    const onPrint = vi.fn();
    render(<PrintMenu onPrint={onPrint} />);
    fireEvent.click(screen.getByRole('button', { name: /print/i }));
    fireEvent.click(screen.getByRole('menuitem', { name: label }));
    expect(onPrint).toHaveBeenCalledWith(scope);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('toggles closed when the trigger is clicked again', () => {
    render(<PrintMenu onPrint={() => {}} />);
    const trigger = screen.getByRole('button', { name: /print/i });
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
