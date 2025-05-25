import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from '../src/entries/side-panel-app.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
