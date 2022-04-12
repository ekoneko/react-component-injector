import React from "react";

interface InjectedOptions<P = any> {
  originComponentType: React.ComponentType<P>;
}

type InjectedFn<P = any> = (
  options: InjectedOptions<P>
) => React.ComponentType<P>;

class ReactComponentInjector {
  injectedComponentsMap: Record<string, InjectedFn> = {};

  proxy<P extends object>(
    path: string,
    OriginComponentType: React.ComponentType<P>
  ) {
    const key = this.encryptPath(path);

    const Wrapped: React.FC<P> = (props) => {
      const injectedFn = this.injectedComponentsMap[key];
      const ComponentType =
        injectedFn?.({ originComponentType: OriginComponentType }) ??
        OriginComponentType;
      return <ComponentType {...props} />;
    };
    return Wrapped;
  }

  inject<P extends React.ComponentType<any>>(
    path: string,
    injectedFn: InjectedFn<P>
  ) {
    const key = this.encryptPath(path);
    this.injectedComponentsMap[key] = injectedFn;
  }

  private encryptPath(key: string) {
    // TODO
    return key;
  }
}
export const reactComponentInjector = new ReactComponentInjector();
