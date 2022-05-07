/**
 * React-jsx is a new way to parse jsx code which not need import React.
 * On this scene, jsx file will auto import "react/jsx-runtime" 
 * and transform jsx to "_jsx("div", { children: "Text" })"
 */
import * as t from "@babel/types";
import { addInjectorLib, checkInjectorLibExists, wrapVariable } from '../utils'

export function getJsxRuntimeTag(programNode: t.Program) {
  const jsxRuntimeDeclarationNode = programNode.body.find(
    (node) =>
      node.type === "ImportDeclaration" &&
      node.source.value === "react/jsx-runtime"
  ) as t.ImportDeclaration | undefined;
  return (
    // react/jsx-runtime is added automated, the type never changed.
    (
      jsxRuntimeDeclarationNode?.specifiers as [t.ImportSpecifier] | undefined
    )?.[0].local.name
  );
}

export function wrapReactJsxComponent(programNode: t.Program, { jsxTag, resourceRelativePath, encrypt }: { jsxTag: string; resourceRelativePath: string; encrypt: (key: string) => string }) {
  let injectorLibExists = checkInjectorLibExists(programNode);
  programNode.body.forEach((node, index) => {
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
      addInjectorLib(programNode);
      index += 1;
      injectorLibExists = true;
    }
    programNode.body.splice(index, 1, variableDeclarationNode, ...wrapVariable(componentName, encrypt(`${resourceRelativePath}#${componentName}`)));
  });
}