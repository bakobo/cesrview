/** A parsed CESR/KERI version string. The v1 format is `PPPPVVKKKKSSSSSS_`: a 4-char PROTOCOL, two
 * hex VERSION nibbles (major.minor), a 4-char serialization KIND, six hex SIZE digits (the body's byte
 * length), and a `_` terminator — e.g. `KERI10JSON00037f_` = KERI 1.0, JSON, 895 bytes. */
export interface ParsedVersion {
  proto: string;
  version: string; // "major.minor"
  kind: string;
  size: number; // body byte length
}

const V1 = /^([A-Z]{4})([0-9a-f])([0-9a-f])([A-Z]{4})([0-9a-f]{6})_$/;

/** Parse a v1 CESR version string into its fields, or null if it is not one (render it as-is then). */
export function parseVersion(value: string): ParsedVersion | null {
  const m = value.match(V1);
  if (!m) return null;
  return {
    proto: m[1],
    version: `${parseInt(m[2], 16)}.${parseInt(m[3], 16)}`,
    kind: m[4],
    size: parseInt(m[5], 16),
  };
}

/** Renders the `v` field: the raw token as-is, followed by a prettified decode in parens —
 * `KERI10JSON00037f_ (KERI 1.0, JSON, 895 bytes)` — so the exact bytes stay visible while the
 * protocol, version, serialization, and declared body size are spelled out. Falls back to the raw
 * text alone for anything that is not a recognized v1 version string. */
export function VersionValue({ value }: { value: string }) {
  const v = parseVersion(value);
  if (!v) return <>{value}</>;
  return (
    <span className="cesr-version">
      <span className="vraw">{value}</span>
      <span className="vpretty">
        {' '}
        ({v.proto} {v.version}, {v.kind}, {v.size} bytes)
      </span>
    </span>
  );
}
