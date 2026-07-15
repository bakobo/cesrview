/* cesrview CESR walker — output contract (decision m4dp7k).
 *
 * A keripy-shaped typed decomposition (message + typed attachment groups) PLUS byte-span
 * provenance on every node, so the UI can sync the decoded tree to the source bytes. This module
 * imports only `signify-ts` (decisions w6ph4k / n6wd3k) and is intended to be upstreamed. */

/** A half-open byte range [start, end) into the original stream. */
export interface ByteSpan {
  start: number;
  end: number;
}

/** Framing outcome for a node (decision d3rk6n). */
export type NodeState =
  | 'known' // recognized code, fully framed
  | 'unknown' // well-formed but code not recognized; may be framable by size rules
  | 'invalid'; // cannot be framed

/** A single CESR primitive (key, digest, signature, sequence number, …) within a group. */
export interface Primitive {
  kind: 'primitive';
  code: string;
  span: ByteSpan;
}

/** A counter-framed attachment group (e.g. controller sigs `-A`, material quadlets `-V`). */
export interface AttachmentGroup {
  kind: 'group';
  code: string;
  count: number;
  span: ByteSpan;
  state: NodeState;
  items: AttachmentNode[]; // typed children; empty for opaque quadlet frames and unknown codes
}

/** A node in the attachment tree. */
export type AttachmentNode = AttachmentGroup | Primitive;

/** A parsed message (KEL/TEL event or ACDC) with its attachments. */
export interface CesrMessage {
  proto: string; // e.g. 'KERI', 'ACDC'
  version: string; // e.g. '1.0'
  kind: string; // serialization, e.g. 'JSON'
  ilk: string | null; // the `t` field, null for ACDCs
  sn: string | null; // the `s` field (hex sequence number), where present
  said: string | null; // the `d` field
  sad: Record<string, unknown>; // the deserialized message body
  span: ByteSpan; // the message body bytes (attachments excluded)
  attachments: AttachmentGroup[];
}

/** A framing failure, with the byte position it occurred at. */
export interface ParseError {
  message: string;
  span: ByteSpan;
}

/** The result of walking a stream: what parsed, what failed, and how far we got. */
export interface WalkResult {
  messages: CesrMessage[];
  errors: ParseError[];
  consumed: number; // bytes contiguously framed from the start
}
