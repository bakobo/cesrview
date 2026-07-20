/** Build a spec deep-link that, on browsers that support the URL Text Fragments directive
 * (Chromium/Safari), scrolls to and highlights the exact `find` phrase; browsers without support
 * (Firefox by default) ignore the directive and still land on the section, so `spec` stays the
 * reliable floor (decision s9grn4). A literal '-' is %2D-escaped because the directive reserves '-'
 * as its range separator; encodeURIComponent handles the rest (spaces -> %20, commas -> %2C, …). */
export function specHref(spec: string, find?: string): string {
  if (!find) return spec;
  const encoded = encodeURIComponent(find).replace(/-/g, '%2D');
  const sep = spec.includes('#') ? ':~:text=' : '#:~:text=';
  return `${spec}${sep}${encoded}`;
}
