import { useState, type ReactNode, type UIEvent } from 'react';

/** Renders a list PROGRESSIVELY (decision v3mk7n): the first `chunk` items, revealing the next chunk
 * as its scroll container nears the end. This bounds the INITIAL paint — the cause of the large-paste
 * freeze — without ever dropping an item or reordering the stream. */
export function EventList<T>({
  items,
  renderItem,
  chunk = 40,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  chunk?: number;
}) {
  const [shown, setShown] = useState(chunk);
  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 400) {
      setShown((s) => Math.min(s + chunk, items.length));
    }
  };
  return (
    <div className="cesr-eventlist" onScroll={onScroll}>
      {items.slice(0, shown).map(renderItem)}
      {shown < items.length ? (
        <p className="list-more">
          Showing {shown} of {items.length} — scroll for more
        </p>
      ) : null}
    </div>
  );
}
