import { createRoot, hydrateRoot } from 'react-dom/client';
import { App, initPageData } from './App';
import { BrowserRouter } from 'react-router-dom';
import { DataContext } from './hooks';
import { ComponentType } from 'react';

declare global {
  interface Window {
    NIKOLAS: Record<string, ComponentType<unknown>>;
    NIKOLA_PROPS: unknown[];
  }
}

async function renderInBrowser() {
  const containerEl = document.getElementById('root');
  if (!containerEl) {
    throw new Error('#root element not found');
  }
  if (import.meta.env.DEV) {
    // 初始化 PageData
    const pageData = await initPageData(location.pathname);
    createRoot(containerEl).render(
      <DataContext.Provider value={pageData}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </DataContext.Provider>
    );
  } else {
    // 生产环境下的 Partial Hydration
    const nikolas = document.querySelectorAll('[__nikola]');
    if (nikolas.length === 0) {
      return;
    }
    for (const nikola of nikolas) {
      // Aside:0
      const [id, index] = nikola.getAttribute('__nikola').split(':');
      const Element = window.NIKOLAS[id] as ComponentType<unknown>;
      hydrateRoot(nikola, <Element {...window.NIKOLA_PROPS[index]} />);
    }
  }
}

renderInBrowser();
