
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

// O segredo da instalabilidade no Chrome e Safari:
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Usar o caminho relativo './sw.js' é o segredo para funcionar na Vercel
    // Isso garante que o SW seja registrado no escopo do seu domínio atual
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => {
        console.log('PWA: Service Worker registrado com sucesso:', reg.scope);
      })
      .catch(err => {
        console.warn('PWA: Falha ao registrar Service Worker (pode ser esperado em dev):', err);
      });
  });
}
