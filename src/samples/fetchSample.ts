/** Fetches a bundled sample's CESR text from the same-origin sample library (decision e7xm4p).
 *  This is the app's ONLY outbound request, made only on an explicit user click, and it carries
 *  none of the user's data. FAIL CLOSED: every failure returns a stable-coded, plain-sentence,
 *  retryable-or-not error rather than throwing or silently doing nothing. */

export interface SampleLoadError {
  code: 'sample-fetch-failed' | 'sample-unavailable';
  message: string;
  /** Whether retrying the same request could plausibly succeed (transient vs. permanent). */
  retryable: boolean;
}

export type SampleResult = { ok: true; text: string } | { ok: false; error: SampleLoadError };

export async function fetchSample(file: string): Promise<SampleResult> {
  const url = `${import.meta.env.BASE_URL}${file}`;
  let res: Response;
  try {
    res = await fetch(url);
  } catch {
    return {
      ok: false,
      error: {
        code: 'sample-fetch-failed',
        message: "Couldn't reach the sample library. Check your connection and try again.",
        retryable: true,
      },
    };
  }
  if (!res.ok) {
    return {
      ok: false,
      error: {
        code: 'sample-unavailable',
        message: `That sample couldn't be loaded — the library returned HTTP ${res.status}.`,
        retryable: false,
      },
    };
  }
  return { ok: true, text: await res.text() };
}
