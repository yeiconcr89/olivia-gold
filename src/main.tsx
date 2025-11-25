import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Temporalmente deshabilitando StrictMode para evitar duplicación en desarrollo
createRoot(document.getElementById('root')!).render(
  <App />
);
