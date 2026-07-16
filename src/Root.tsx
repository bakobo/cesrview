import { useSyncExternalStore } from 'react';
import App from './App';
import Gallery from './Gallery';

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** Chooses the view from the URL hash and reacts to hash changes, so the /#gallery link works without
 * a reload: the product App by default, the component Gallery at #gallery. */
export default function Root() {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return hash === '#gallery' ? <Gallery /> : <App />;
}
