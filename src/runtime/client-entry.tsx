import { createRoot } from "react-dom/client";
import { App } from "./App";

function renderInBrowser() {
  const containerEl = document.getElementById("root");
  if (!containerEl) {
    throw new Error("Failed to find the root element");
  }
  createRoot(containerEl).render(<App />);
}

renderInBrowser();
