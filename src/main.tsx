import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import Gallery from './Gallery';

// The product view is App; navigating to /#gallery shows the component gallery instead.
const Root = window.location.hash === '#gallery' ? Gallery : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
);
