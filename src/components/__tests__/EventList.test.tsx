import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { EventList } from '../EventList';

const items = Array.from({ length: 100 }, (_, i) => i);
const renderItem = (x: number, k: number) => <div key={k} className="item" data-v={x} />;

/* jsdom has no IntersectionObserver. Mock it and capture the callback so a test can drive an
 * intersection — modelling the sentinel scrolling into view regardless of WHICH ancestor is the
 * scroll container (the real bug: EventList listened for scroll on its own non-scrolling div). */
let ioCallbacks: IntersectionObserverCallback[];
class MockIO {
  constructor(cb: IntersectionObserverCallback) {
    ioCallbacks.push(cb);
  }
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}
const intersect = (isIntersecting: boolean) =>
  act(() => {
    ioCallbacks.forEach((cb) =>
      cb([{ isIntersecting } as IntersectionObserverEntry], {} as IntersectionObserver),
    );
  });

beforeEach(() => {
  ioCallbacks = [];
  vi.stubGlobal('IntersectionObserver', MockIO);
});
afterEach(() => vi.unstubAllGlobals());

describe('EventList', () => {
  it('renders only the first chunk, with a "more" sentinel', () => {
    const { container } = render(<EventList items={items} renderItem={renderItem} chunk={40} />);
    expect(container.querySelectorAll('.item')).toHaveLength(40);
    expect(container.querySelector('.list-more')).toBeInTheDocument();
  });

  it('reveals the next chunk when the sentinel scrolls into view — not when its own div scrolls', () => {
    const { container } = render(<EventList items={items} renderItem={renderItem} chunk={40} />);
    intersect(false); // sentinel not yet visible -> no change
    expect(container.querySelectorAll('.item')).toHaveLength(40);
    intersect(true); // sentinel entered the viewport -> +chunk, regardless of which element scrolls
    expect(container.querySelectorAll('.item')).toHaveLength(80);
  });

  it('renders everything and shows no sentinel when the items fit in a chunk', () => {
    const { container } = render(<EventList items={[1, 2, 3]} renderItem={renderItem} chunk={40} />);
    expect(container.querySelectorAll('.item')).toHaveLength(3);
    expect(container.querySelector('.list-more')).not.toBeInTheDocument();
  });

  it('renders EVERY item and no sentinel when expandAll is set (print fail-closed)', () => {
    const { container } = render(
      <EventList items={items} renderItem={renderItem} chunk={40} expandAll />,
    );
    expect(container.querySelectorAll('.item')).toHaveLength(100);
    expect(container.querySelector('.list-more')).not.toBeInTheDocument();
  });
});
