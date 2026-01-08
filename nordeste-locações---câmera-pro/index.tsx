
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registro do Service Worker apenas se suportado e fora de ambientes restritos (como preview sandboxes)
// Em produção na Vercel, isso funcionará perfeitamente.
if ('serviceWorker' in navigator && window.location.hostname !== 'ai.studio') {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('Service Worker registrado!', reg.scope))
      .catch(err => console.log('Falha ao registrar Service Worker:', err));
  });
}
