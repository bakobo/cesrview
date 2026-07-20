import { useCallback, useState, type DragEvent } from 'react';

/** Drag-and-drop file loading for the input panel (decision d6rp2k). Only FILE drags are hijacked —
 * a text/selection drag is left to the browser. On drop, the FIRST file is read as text and handed
 * to `onText` (which replaces the stream); non-CESR text falls through to the normal parse-error
 * path. Returns `dragging` (for a drop-zone highlight) and `dropProps` to spread onto the zone. */
export function useFileDrop(onText: (text: string) => void) {
  const [dragging, setDragging] = useState(false);

  const onDragOver = useCallback((e: DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return; // not a file drag — ignore
    e.preventDefault(); // required for the drop event to fire
    setDragging(true);
  }, []);

  const onDragLeave = useCallback(() => setDragging(false), []);

  const onDrop = useCallback(
    (e: DragEvent) => {
      const file = e.dataTransfer.files[0];
      if (!file) return; // nothing to load
      e.preventDefault(); // stop the browser from navigating to / opening the file
      setDragging(false);
      file.text().then(onText);
    },
    [onText],
  );

  return { dragging, dropProps: { onDragOver, onDragLeave, onDrop } };
}
