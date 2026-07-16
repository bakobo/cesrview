import { render, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EventList } from '../EventList';

const items = Array.from({ length: 100 }, (_, i) => i);
const renderItem = (x: number, k: number) => <div key={k} className="item" data-v={x} />;
const setScroll = (el: Element, top: number, client: number, height: number) => {
  Object.defineProperty(el, 'scrollTop', { value: top, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: client, configurable: true });
  Object.defineProperty(el, 'scrollHeight', { value: height, configurable: true });
};

describe('EventList', () => {
  it('renders only the first chunk, with a "more" footer', () => {
    const { container } = render(<EventList items={items} renderItem={renderItem} chunk={40} />);
    expect(container.querySelectorAll('.item')).toHaveLength(40);
    expect(container.querySelector('.list-more')).toBeInTheDocument();
  });

  it('reveals the next chunk only when scrolled near the end', () => {
    const { container } = render(<EventList items={items} renderItem={renderItem} chunk={40} />);
    const list = container.querySelector('.cesr-eventlist')!;
    setScroll(list, 100, 800, 2000); // far from the end -> no change
    fireEvent.scroll(list);
    expect(container.querySelectorAll('.item')).toHaveLength(40);
    setScroll(list, 1700, 800, 2000); // near the end -> +chunk
    fireEvent.scroll(list);
    expect(container.querySelectorAll('.item')).toHaveLength(80);
  });

  it('renders everything and shows no footer when the items fit in a chunk', () => {
    const { container } = render(<EventList items={[1, 2, 3]} renderItem={renderItem} chunk={40} />);
    expect(container.querySelectorAll('.item')).toHaveLength(3);
    expect(container.querySelector('.list-more')).not.toBeInTheDocument();
  });
});
