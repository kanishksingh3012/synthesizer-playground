import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { useStore } from './state/store';
import { DEMO } from './presets';

useStore.setState(DEMO);
if (import.meta.env.DEV) Object.assign(window, { __store: useStore, __tone: await import('tone'), __audioCheck: (await import('./dev/audioCheck')).audioCheck, __export: (await import('./audio/export')).exportFile });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
