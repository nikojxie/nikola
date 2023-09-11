import * as jsxRuntime from 'react/jsx-runtime';

// 拿到 React 原始的 jsxRuntime 方法，包括 jsx 和 jsxs
// 注: 对于一些静态节点，React 会使用 jsxs 来进行创建，优化渲染性能
const originJsx = jsxRuntime.jsx;
const originJsxs = jsxRuntime.jsxs;

export const data = {
  nikolaProps: [],
  nikolaToPathMap: {}
};

const internalJsx = (jsx, type, props, ...args) => {
  // 如果发现有 __nikola 这个 prop，则视为一个 Nikola 组件，记录下来
  if (props && props.__nikola) {
    data.nikolaProps.push(props);
    const id = type.name;
    data['nikolaToPathMap'][id] = props.__nikola;

    delete props.__nikola;
    return jsx('div', {
      __nikola: `${id}:${data.nikolaProps.length - 1}`,
      children: jsx(type, props, ...args)
    });
  }
  // 否则走原始的 jsx/jsxs 方法
  return jsx(type, props, ...args);
};

// 下面是我们自定义的 jsx 和 jsxs
export const jsx = (...args) => internalJsx(originJsx, ...args);

export const jsxs = (...args) => internalJsx(originJsxs, ...args);

export const Fragment = jsxRuntime.Fragment;

export const clearNikolaData = () => {
  data.nikolaProps = [];
  data.nikolaToPathMap = {};
};
