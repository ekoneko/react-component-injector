import { createRoot } from "react-dom/client";
import { A } from "./ComponentA";
import { B } from "./ComponentB";

const App: React.FC = () => {
  return (
    <div>
      <A />
      <B />
    </div>
  );
};

const root = createRoot(document.getElementById("root")!);
root.render(<App />);
