import { describe, it, expect, vi, afterEach } from 'vitest';
import { fetchSample } from '../fetchSample';

afterEach(() => vi.restoreAllMocks());

describe('fetchSample', () => {
  it('fetches the file under the app base URL and returns its text on success', async () => {
    const fetchMock = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('CESR-BYTES', { status: 200 }));
    const result = await fetchSample('samples/kel.cesr');
    expect(fetchMock).toHaveBeenCalledWith('/samples/kel.cesr');
    expect(result).toEqual({ ok: true, text: 'CESR-BYTES' });
  });

  it('fails closed and retryable when the library is unreachable (offline / network error)', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'));
    const result = await fetchSample('samples/kel.cesr');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('sample-fetch-failed');
      expect(result.error.retryable).toBe(true);
      expect(result.error.message).toMatch(/couldn.t reach/i);
    }
  });

  it('fails closed and non-retryable on an HTTP error (an unpublished / missing sample)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('nope', { status: 404 }));
    const result = await fetchSample('samples/missing.cesr');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('sample-unavailable');
      expect(result.error.retryable).toBe(false);
      expect(result.error.message).toMatch(/404/);
    }
  });
});
