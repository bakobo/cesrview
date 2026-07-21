/** One entry in the bundled sample library (decision e7xm4p). METADATA only — the CESR bytes are
 *  never compiled into the app; `file` names a static file published under public/samples/ and
 *  fetched on demand (see fetchSample). `file` is relative to the app base URL. */
export interface SampleMeta {
  id: string;
  label: string;
  description: string;
  file: string;
}

/* The starting corpus: the three PII-free v1 samples that frame cleanly today. The v2 twins are
 * excluded until the walker frames CESR-2 (h6rk4d); a TEL + ACDC example is a follow-up ~32l6 (needs
 * a credential-issuance flow to generate clean data). Provenance: samples/PROVENANCE.md. */
export const SAMPLES: SampleMeta[] = [
  {
    id: 'kel',
    label: 'Key event log',
    description: "A controller's KEL: inception, rotation, then an interaction event.",
    file: 'samples/kel-icp-rot-ixn.cesr',
  },
  {
    id: 'witness-oobi',
    label: 'Witness OOBI',
    description: "A witness's controller OOBI response — its KEL plus endpoint-authorization replies.",
    file: 'samples/witness-controller-oobi.cesr',
  },
  {
    id: 'witness-role-oobi',
    label: 'Witness-role OOBI',
    description: 'A witness-role OOBI: the inception event that introduces a witness.',
    file: 'samples/witness-role-oobi.cesr',
  },
];
