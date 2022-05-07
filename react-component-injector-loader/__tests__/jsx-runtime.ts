import { parse as babelParse } from "@babel/parser";
import reactInjectorLoader from '../index'
import { getJsxRuntimeTag } from "../translators/reactJsx";

const code = `import { jsx as _jsx } from "react/jsx-runtime";
import { reactComponentInjector } from "react-component-injector";
const a = 'test';
export var A = function () { var a = 'xxx'; return _jsx("span", { children: "Hello" }); };

var B = function () { return _jsx("span", { children: "World" }); };
var WrappedB = reactComponentInjector.define("src/ComponentB#B", B);
export { WrappedB as B };`

describe('jsx-runtime', () => {
  test('detect', () => {
    const ast = babelParse(code, { sourceType: "module" });
    expect(getJsxRuntimeTag(ast.program)).toEqual('_jsx')
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