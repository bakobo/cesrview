import { useState, useRef, useEffect, type ReactNode } from 'react';

/** Renders a list PROGRESSIVELY (decision v3mk7n): the first `chunk` items, revealing the next chunk
 * as the "more" sentinel scrolls into view. This bounds the INITIAL paint — the cause of the
 * large-paste freeze — without ever dropping an item or reordering the stream.
 *
 * Loading is driven by an IntersectionObserver on the sentinel, NOT a scroll handler on this
 * component's own element: the real scroll container is usually an ANCESTOR (e.g. `.cesr-source`
 * has `overflow: auto`, this inner div does not), and scroll events do not bubble — so a self-bound
 * scroll listener never fired and the list stuck at the first chunk. */
export function EventList<T>({
  items,
  renderItem,
  chunk = 40,
  expandAll = false,
}: {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  chunk?: number;
  /** Render every item at once with no sentinel — used when printing the transcript, where a
   * progressively-rendered (truncated) DOM would silently misrepresent the stream (p9rn5t). */
  expandAll?: boolean;
}) {
  const [shown, setShown] = useState(chunk);
  const sentinelRef = useRef<HTMLParagraphElement | null>(null);
  const hasMore = !expandAll && shown < items.length;
  const count = expandAll ? items.length : shown;

  useEffect(() => {
    if (!hasMore) return;
    const el = sentinelRef.current!;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        setShown((s) => Math.min(s + chunk, items.length));
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, chunk, items.length]);

  return (
    <div className="cesr-eventlist">
      {items.slice(0, count).map(renderItem)}
      {hasMore ? (
        <p className="list-more" ref={sentinelRef}>
          Showing {shown} of {items.length} — scroll for more
        </p>
      ) : null}
    </div>
  );
}
