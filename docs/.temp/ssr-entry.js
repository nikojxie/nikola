"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const jsxRuntime = require("react/jsx-runtime");
const react = require("react");
const server = require("react-dom/server");
function Layout() {
  const [count, setCount] = react.useState(0);
  return /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
    /* @__PURE__ */ jsxRuntime.jsx("h1", { children: "addThis is Layout Component 12dd3d" }),
    /* @__PURE__ */ jsxRuntime.jsxs("div", { children: [
      count,
      /* @__PURE__ */ jsxRuntime.jsx("button", { onClick: () => setCount(count + 1), children: "Add Count" })
    ] })
  ] });
}
function App() {
  return /* @__PURE__ */ jsxRuntime.jsx(Layout, {});
}
function render() {
  return server.renderToString(/* @__PURE__ */ jsxRuntime.jsx(App, {}));
}
exports.render = render;
