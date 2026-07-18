import '@testing-library/jest-dom';

/* jsdom ships no IntersectionObserver, but EventList (progressive rendering) now depends on one.
 * Provide a no-op stub so any test that renders a multi-chunk list doesn't crash; tests that need
 * to drive intersection (EventList's own) override this via vi.stubGlobal with a capturing mock. */
class IntersectionObserverStub {
  root = null;
  rootMargin = '';
  thresholds: ReadonlyArray<number> = [];
  constructor(_cb: IntersectionObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
globalThis.IntersectionObserver ??=
  IntersectionObserverStub as unknown as typeof IntersectionObserver;
