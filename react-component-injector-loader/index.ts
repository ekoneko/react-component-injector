import { parse as babelParse } from "@babel/parser";
import traverse from "@babel/traverse";
import generate from "@babel/generator";
import * as t from "@babel/types";
import type { LoaderDefinition } from "webpack";

const INJECTOR_LIB_NAME = "react-component-injector";
const INJECTOR_METHOD_NAME = "reactComponentInjector";

function getJsxRuntimeTag(programNode: t.Program) {
  const jsxRuntimeDeclarationNode = programNode.body.find(
    (node) =>
      node.type === "ImportDeclaration" &&
      node.source.value === "react/jsx-runtime"
  ) as t.ImportDeclaration | undefined;
  return (
    // react/jsx-runtime is added automated, the type is fixed.
    (
      jsxRuntimeDeclarationNode?.specifiers as [t.ImportSpecifier] | undefined
    )?.[0].local.name
  );
}
function checkInjectorLibExists(programNode: t.Program) {
  return !!programNode.body.find(
    (node) =>
      node.type === "ImportDeclaration" &&
      node.source.value === INJECTOR_LIB_NAME
  );
}
function addInjectorLib(programNode: t.Program) {
  programNode.body.unshift(
    t.importDeclaration(
      [
        t.importSpecifier(
          t.identifier(INJECTOR_METHOD_NAME),
          t.identifier(INJECTOR_METHOD_NAME)
        ),
      ],
      t.stringLiteral(INJECTOR_LIB_NAME)
    )
  );
}

export default (function (source: string) {
  const ast = babelParse(source, { sourceType: "module" });
  const resourceRelativePath = this.resourcePath.replace(process.cwd(), '')
  traverse(ast, {
    Program(programPath) {
      const jsxTag = getJsxRuntimeTag(programPath.node);
      if (!jsxTag) {
        // no jsx-runtime reference, skip
        return;
      }
      let injectorLibExists = checkInjectorLibExists(programPath.node);
      programPath.node.body.forEach((node, index) => {
        if (node.type !== "ExportNamedDeclaration") {
          return;
        }
        const variableDeclarationNode = node.declaration;
        if (
          variableDeclarationNode?.type !== "VariableDeclaration" ||
          variableDeclarationNode.declarations[0]?.type !==
          "VariableDeclarator" ||
          variableDeclarationNode.declarations[0]?.init?.type !==
          "FunctionExpression"
        ) {
          return;
        }
        const returnStatementNode =
          variableDeclarationNode.declarations[0]?.init.body.body.find(
            (item) => item.type === "ReturnStatement"
          ) as t.ReturnStatement;
        if (returnStatementNode?.argument?.type !== "CallExpression") {
          return;
        }
        const returnCallee = returnStatementNode.argument.callee;
        if (
          returnCallee.type !== "Identifier" ||
          returnCallee.name !== jsxTag ||
          variableDeclarationNode.declarations[0].id.type !== "Identifier"
        ) {
          return;
        }
        const componentName = variableDeclarationNode.declarations[0].id.name;
        if (!injectorLibExists) {
          addInjectorLib(programPath.node);
          index += 1;
          injectorLibExists = true;
        }
        // TODO: make sure the id is unique
        const wrappedName = `$$Wrapped${componentName}`;
        const wrappedKey = `${resourceRelativePath}#${componentName}`
        const wrappedVariableDeclarationNode = t.variableDeclaration("var", [
          t.variableDeclarator(
            t.identifier(wrappedName),
            t.callExpression(
              t.memberExpression(
                t.identifier(INJECTOR_METHOD_NAME),
                t.identifier("proxy")
              ),
              [t.stringLiteral(wrappedKey), t.identifier(componentName)]
            )
          ),
        ]);
        const exportWrapperNode = t.exportNamedDeclaration(null, [
          t.exportSpecifier(t.identifier(wrappedName), t.identifier(componentName))
        ])
        programPath.node.body.splice(index, 1, variableDeclarationNode, wrappedVariableDeclarationNode, exportWrapperNode);
      });
    },
  });
  return generate(ast, {}, source).code;
} as LoaderDefinition);
