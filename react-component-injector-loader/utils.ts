import * as t from "@babel/types";

export const INJECTOR_LIB_NAME = "react-component-injector";
export const INJECTOR_METHOD_NAME = "reactComponentInjector";

export function checkInjectorLibExists(programNode: t.Program) {
  return !!programNode.body.find(
    (node) =>
      node.type === "ImportDeclaration" &&
      node.source.value === INJECTOR_LIB_NAME
  );
}
export function addInjectorLib(programNode: t.Program) {
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

export function wrapVariable(componentName: string, key: string) {
  const wrappedName = `$$Wrapped${componentName}`;
  const wrappedVariableDeclarationNode = t.variableDeclaration("var", [
    t.variableDeclarator(
      t.identifier(wrappedName),
      t.callExpression(
        t.memberExpression(
          t.identifier(INJECTOR_METHOD_NAME),
          t.identifier("proxy")
        ),
        [t.stringLiteral(key), t.identifier(componentName)]
      )
    ),
  ]);
  const exportWrapperNode = t.exportNamedDeclaration(null, [
    t.exportSpecifier(t.identifier(wrappedName), t.identifier(componentName))
  ])
  return [wrappedVariableDeclarationNode, exportWrapperNode]
}