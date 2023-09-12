import { App, initPageData } from './App';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { DataContext } from './hooks';

export interface RenderResult {
  appHtml: string;
  nikolaProps: unknown[];
  nikolaToPathMap: Record<string, string>;
}

// For ssr component render
export async function render(pagePath: string) {
  const pageData = await initPageData(pagePath);
  const { clearNikolaData, data } = await import('./jsx-runtime');
  clearNikolaData();
  const appHtml = renderToString(
    <DataContext.Provider value={pageData}>
      <StaticRouter location={pagePath}>
        <App />
      </StaticRouter>
    </DataContext.Provider>
  );
  const { nikolaProps, nikolaToPathMap } = data;
  return {
    appHtml,
    nikolaProps,
    nikolaToPathMap
  };
}

export { routes } from 'nikola:routes';
