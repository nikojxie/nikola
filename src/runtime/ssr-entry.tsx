import { App } from './App';
import { renderToString } from 'react-dom/server';

// For ssr component render
export function render() {
  return renderToString(<App />);
}
