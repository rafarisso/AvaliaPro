import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';

const rootElement = document.getElementById('root');

// Função para verificar se as variáveis de ambiente essenciais estão presentes
function checkEnvironment() {
  // Acessa as variáveis de ambiente a partir do objeto window.ENV
  const env = (window as any).ENV;
  if (!env || !env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
    return false;
  }
  return true;
}


if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

if (checkEnvironment()) {
  // Se o ambiente estiver configurado, renderiza a aplicação
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <HashRouter>
        <App />
      </HashRouter>
    </React.StrictMode>
  );
} else {
  // Se não, exibe uma mensagem de erro clara
  rootElement.innerHTML = '<div style="font-family: sans-serif; padding: 2rem; color: #333;">' +
    '<h1>Erro Crítico de Configuração</h1>' +
    '<p>As variáveis de ambiente (<code>VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code>) não foram encontradas.</p>' +
    '<p>Por favor, verifique o script de configuração no <code>index.html</code>.</p>' +
  '</div>';
  console.error("Falha ao carregar a configuração do ambiente. O objeto window.ENV está incompleto ou ausente.");
}