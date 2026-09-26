import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { useStore } from './state/store';
import { DEMO } from './presets';

useStore.setState(DEMO);
if (import.meta.env.DEV) Object.assign(window, { __store: useStore, __tone: await import('tone') });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
