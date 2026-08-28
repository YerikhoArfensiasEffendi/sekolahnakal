import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initConsoleSecurity } from './lib/antiTamper';
import './styles/globals.css';

// Inisialisasi banner konsol aktif
initConsoleSecurity();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
