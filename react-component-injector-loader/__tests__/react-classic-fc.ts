import { parse as babelParse } from "@babel/parser";
import reactInjectorLoader from '../index'
import { getReactTag } from "../translators/reactClassicFC";

const code = `import React from 'react';
export var Breadcrumb = function (_a) {
  return (React.createElement(StyleWrapper, { className: className },
    React.createElement(StyleContainer, null, items.map(function (item, index) {
        if (index !== 0 && index < hiddenCount + 1) {
            return null;
        }
        return (React.createElement(StyleItem, { key: index },
            React.createElement(StyleText, { onClick: createHandleClick(index), width: index < collapsedCount ? collapsedWidthPx + "px" : undefined }, item),
            React.createElement(StyleArrowWrapper, null, arrowIcon !== null && arrowIcon !== void 0 ? arrowIcon : React.createElement(StyleArrow, null))));
    })),
    React.createElement(StyleHiddenContainer, { ref: hiddenContainerRef }, items.map(function (item, index) { return (React.createElement(StyleItem, { key: index },
        React.createElement(StyleText, null, item),
        React.createElement(StyleArrow, null))); }))));
}`

describe('jsx-runtime', () => {
  test('detect', () => {
    const ast = babelParse(code, { sourceType: "module" });
    expect(getReactTag(ast.program)).toEqual('React')
  })
  test('wrap', () => {
    expect(reactInjectorLoader.bind({
      resourcePath: '/path/to/component.tsx',
      getOptions: () => ({
        encrypt: (key: string) => key
      })
    })(code)).toMatchSnapshot();
  })
})