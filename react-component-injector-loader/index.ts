import { parse as babelParse } from "@babel/parser";
import generate from "@babel/generator";
import type { LoaderDefinition } from "webpack";
import { getJsxRuntimeTag, wrapReactJsxComponent } from './translators/reactJsx'
import { getReactTag, wrapReactClassicFC } from './translators/reactClassicFC'

function defaultEncrypt(key: string) {
  return key
}

export default (function (source: string) {
  const ast = babelParse(source, { sourceType: "module" });
  const resourceRelativePath = this.resourcePath.replace(process.cwd(), '')
  const jsxTag = getJsxRuntimeTag(ast.program);
  const { encrypt = defaultEncrypt } = this.getOptions()
  let wrapped = false
  if (jsxTag) {
    wrapped = true
    wrapReactJsxComponent(ast.program, { jsxTag, resourceRelativePath, encrypt })
  }
  const reactTag = getReactTag(ast.program);
  if (reactTag) {
    wrapped = true
    wrapReactClassicFC(ast.program, { reactTag, resourceRelativePath, encrypt })
  }
  return wrapped ? generate(ast, {}, source).code : source;
} as LoaderDefinition<{ encrypt?: (key: string) => string }>);
