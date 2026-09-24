import '@fontsource/ibm-plex-sans/400.css';
import '@fontsource/ibm-plex-sans/500.css';
import '@fontsource/ibm-plex-sans/600.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';
import './styles/tokens.css';
import './styles/global.css';
import './styles/board.css';
import './styles/panel.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { ErrorBoundary } from './ui/ErrorBoundary';

const reloadBoard = (): void => window.location.assign(window.location.pathname);

const container = document.getElementById('root');
if (!container) throw new Error('#root не найден в index.html');
createRoot(container).render(
  <StrictMode>
    <ErrorBoundary
      fallback={(message) => (
        <main className="app-state">
          <div role="alert">
            <p>Интерфейс desk не отрисовался: {message}</p>
            <button type="button" className="button" onClick={reloadBoard}>
              Перезагрузить доску
            </button>
          </div>
        </main>
      )}
    >
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
