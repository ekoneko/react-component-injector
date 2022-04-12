import { reactComponentInjector } from "react-component-injector";
import type { B } from "../../sources/src/ComponentB";

reactComponentInjector.inject<typeof B>(
  "/sources/src/ComponentB.tsx#B",
  () => () => <span>React</span>
);
