/* cesrview pretty-printer (decision s5kn7w).
 *
 * A pure, tier-1 transformation of a walked stream into a multi-line source rendering — a newline per
 * message body (as indented JSON) and per attachment group/primitive — where every display line
 * carries its ORIGINAL byte span. That mapping is what makes line numbers meaningful and gives the
 * byte<->node provenance the source pane and (later) selection sync need. Message bodies map coarsely
 * to the whole body span (the walker does not split JSON fields); attachments map finely. */

import type { AttachmentGroup, ByteSpan, WalkResult } from './types';

const td = new TextDecoder();

/** One rendered line of the source pane, tied back to its original bytes (null for lines that have no
 * direct byte origin). */
export interface PrettyLine {
  text: string;
  span: ByteSpan | null;
}

/** The pretty-printed source document: the joined text plus the per-line byte-span map. */
export interface PrettyDoc {
  text: string;
  lines: PrettyLine[];
}

function pushGroup(group: AttachmentGroup, depth: number, bytes: Uint8Array, lines: PrettyLine[]): void {
  const indent = '  '.repeat(depth);
  lines.push({ text: `${indent}${group.code} ×${group.count}`, span: group.span });
  for (const item of group.items) {
    if (item.kind === 'group') {
      pushGroup(item, depth + 1, bytes, lines);
    } else {
      const value = td.decode(bytes.subarray(item.span.start, item.span.end));
      lines.push({ text: `${indent}  ${value}`, span: item.span });
    }
  }
}

/** Pretty-print a walked stream into lines carrying their original byte spans (decision s5kn7w). */
export function prettyPrint(result: WalkResult, bytes: Uint8Array): PrettyDoc {
  const lines: PrettyLine[] = [];
  for (const m of result.messages) {
    if (m.sad) {
      for (const line of JSON.stringify(m.sad, null, 2).split('\n')) lines.push({ text: line, span: m.span });
    } else {
      lines.push({ text: `‹${m.kind} body — ${m.span.end - m.span.start} bytes, undecoded›`, span: m.span });
    }
    for (const g of m.attachments) pushGroup(g, 0, bytes, lines);
  }
  for (const e of result.errors) lines.push({ text: `! ${e.message}`, span: e.span });
  return { text: lines.map((l) => l.text).join('\n'), lines };
}
