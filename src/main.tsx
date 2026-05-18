import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason) {
     const msg = typeof event.reason === 'string' ? event.reason : (event.reason.message || event.reason.toString());
     if (msg && msg.includes('The play() request was interrupted')) {
        event.preventDefault();
        return;
     }
  }
});

const originalError = console.error;
console.error = (...args) => {
  if (args[0]) {
     const msg = typeof args[0] === 'string' ? args[0] : (args[0].message || args[0].toString());
     if (msg && msg.includes('The play() request was interrupted')) {
        return;
     }
  }
  originalError.apply(console, args);
};

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (registration) => {
        console.log('SW registered: ', registration);
      },
      (err) => {
        console.log('SW registration failed: ', err);
      }
    );
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
