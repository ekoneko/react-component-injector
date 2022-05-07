import React from "react";
import md5 from "md5";

interface InjectedOptions<P = any> {
  originComponentType: React.ComponentType<P>;
}

type InjectedFn<P = any> = (
  options: InjectedOptions<P>
) => React.ComponentType<P>;

class ReactComponentInjector {
  injectedComponentsMap: Record<string, InjectedFn> = {};

  proxy<P extends object>(
    key: string,
    OriginComponentType: React.ComponentType<P>
  ) {
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
    // NOTE: use same way as loader
    return md5(key);
  }
}
export const reactComponentInjector = new ReactComponentInjector();
