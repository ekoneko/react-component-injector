# 一个基于 React 组件的定制化方案与探索

对于业务型的项目，有时候我们不得不做出一定的妥协来满足诸如 self hosting 等场景的定制性需求。

如果不做任何的处理在代码上添加大段的 `if else`, 久而久之项目库会变得难以理解与维护。

一种较为理想的原则是：将定制的逻辑与标准代码库分离开，以保证标准库尽可能的“整洁”。

希望在不侵入源码的基础上，对一些例如 self hosting 的场景进行定制化改造。

例如这样的一个场景中：

```tsx
// src/ComponentA.tsx
export const A: React.FC = () => <span>Hello</span>;
```

```tsx
// src/ComponentB.tsx
export const B: React.FC = () => <span>World</span>;
```

```tsx
// src/App.tsx
import { A } from "ComponentA";
import { B } from "ComponentB";

render(
  <div>
    <A />
    <B />
  </div>
);
```

我们期望将 ComponentB 的返回值替换为 `<span>React</span>`.

一种零侵入的做法是，注入一个脚本来替换 B 组件的实现:

```tsx
sdk.inject(
  "src/ComponentB#B",
  ({ OriginComponentType: ComponentB }) =>
    (/* BProps */) =>
      <span>React</span>
);
```

`inject` 的第一个参数为需要 inject 的组件在源码中的位置(通常构建时我们并不想暴露源码路径，可以在源码与注入脚本两端以相同方式混淆路径即可)， 第二个参数构造了返回的新组件(可以拿到原始组件方便部分替换的场合)。

## Principles

在讨论具体怎么做之前，先确定下这种注入方式的一些基本原则。

1. 定制脚本是在熟悉标准库的基础上开发的。定制脚本开发者应该理解并且能随时查阅标准代码库。

2. 标准库是稳定的且遵循一定版本迭代规则。

标准库并不要求是一成不变的，但如果处于反复进行大面积重构的状态会导致脚本难以维护。

伴随标准库升级定制脚本的兼容问题是必然存在的，这是定制化所带来的必然的成本。

但良好的项目迭代方式与 Break Change 描述文档可以使定制成本降低到最低。

3. 保证定制脚本的兼容性是开发定制脚本的一部分。

如上一条所述，定制必然会带来升级时的兼容性问题，思考如何让问题在开发阶段暴露出来本身也是定制开发的一部分。

4. 定制脚本的支持并不意味无条件的拥抱定制性需求。这种注入的方式只是提供了一种工具，并不应该影响到问题的决策。定制所带来的成本是长期的，应该谨慎考虑。

## How To

为了实现这个效果需要做到三件事情：

### 构建系统支持

在构建时将原组件进行一步代理，例如将

```tsx
// src/ComponentB.tsx
export const B: React.FC = () => <span>World</span>;
```

转换为

```tsx
// src/ComponentB.tsx
const B: React.FC = () => <span>World</span>;
const WrappedB = sdk.proxy("src/ComponentB#B", B);
export { WrappedB as B };
```

这样一来当渲染 B 组件时即可选择性的加载上文中 `sdk.inject` 提供的组件.

### 类型映射

定制的脚本和源码应该是独立维护的， 但仍旧期望能获取对应源码的类型信息。

一种方式是将源码库作为一个 submodule 加入到脚本项目中，直接引用相应文件地址。 也可以在构建源码项目时生成对应的类型文件提供给外部加载。

```tsx
import type { B } from "sources/src/ComponentB";

sdk.inject<B>("src/ComponentB#B", () => <span>React</span>);
```

### 长期支持

通常软件项目都是持续交付与迭代的，定制脚本也需要考虑到升级时可能造成的不兼容。类型与测试可以使大部分问题在构建时暴露出来。

因此定制脚本本身应具备完善的测试脚本 (单元测试或 E2E 测试)。

## Demo

这个项目提供了一个简单的定制脚本示例。

可以 `npm start` 启动演示。

### [source](source)

一个简单的 React 组件示例。

### [react-component-injector](react-component-injector/index.tsx)

提供 React 组件的代理与注入。

```tsx
class ReactComponentInjector {
  // 代理一个组件， 当 inject 中存在对应 key 时，会自动替换为对应的组件
  proxy(key, componentType) {}
  // 以自定义组件替换原组件
  inject(key, injectFn) {}
}
```

### [react-component-injector-loader](react-component-injector-loader/index.ts)

NOTICE： 这个 loader 只是用来验证可行性的，没有覆盖所有场景。

用于包裹原组件的 webpack loader. 将

```tsx
// src/ComponentB.tsx
export const B: React.FC = () => <span>World</span>;
```

转换为

```tsx
// src/ComponentB.tsx
import { reactComponentInjector } from "react-component-injector";
const B: React.FC = () => <span>World</span>;
const WrappedB = reactComponentInjector.proxy("src/ComponentB.tsx#B", B);
export { WrappedB as B };
```

Demo 中这个 loader 是在 ts-loader 之后执行的，本身没有处理 tsc 的能力。

```ts
// webpack.config.ts
export default {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "react-component-injector-loader",
          },
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
};
```

### [scripts](scripts/src/index.tsx)

定制脚本
