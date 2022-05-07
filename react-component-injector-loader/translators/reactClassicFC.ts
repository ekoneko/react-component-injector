/**
 * React translate jsx with React.createElement before 17.
 * It need import react manually.
 */

import * as t from "@babel/types";
import { addInjectorLib, checkInjectorLibExists, wrapVariable } from "../utils";

export function getReactTag(programNode: t.Program) {
  const reactDeclarationNode = programNode.body.find(
    (node) =>
      node.type === "ImportDeclaration" &&
      node.source.value === "react"
  ) as t.ImportDeclaration | undefined;
  const reactDefaultSpecifier = reactDeclarationNode?.specifiers.find(specifier => specifier.type === 'ImportDefaultSpecifier') as t.ImportDefaultSpecifier | null
  return reactDefaultSpecifier?.local.name
}

export function wrapReactClassicFC(programNode: t.Program, { reactTag, resourceRelativePath, encrypt }: { reactTag: string; resourceRelativePath: string; encrypt: (key: string) => string }) {
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
    if (returnStatementNode?.argument?.type !== "CallExpression") {
      return;
    }
    const returnCallee = returnStatementNode.argument.callee;
    if (
      returnCallee.type !== 'MemberExpression' ||
      returnCallee.object.type !== 'Identifier' ||
      returnCallee.object.name !== reactTag ||
      returnCallee.property.type !== 'Identifier' ||
      returnCallee.property.name !== 'createElement' ||
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