/** Decode a CESR **Dater** primitive (datetime) from its qb64 to an ISO-8601 string, or null if the
 * text is not a Dater. A Dater is the 4-char code `1AAG` followed by a 32-char base64url-safe ISO
 * datetime in which CESR substitutes the three non-b64url characters: `:`→`c`, `.`→`d`, `+`→`p`.
 * The reversal is unambiguous — a b64-safe datetime contains only digits, `-`, `T`, and those three
 * substitution letters — so this is a straight character swap, no byte decoding. */
export function daterToIso(qb64: string): string | null {
  if (qb64.length !== 36 || !qb64.startsWith('1AAG')) return null;
  return qb64.slice(4).replace(/c/g, ':').replace(/d/g, '.').replace(/p/g, '+');
}
