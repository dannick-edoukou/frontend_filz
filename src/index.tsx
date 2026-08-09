import "./index.css";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { ThemeProvider } from "./theme/ThemeProvider";

const rootEl = document.getElementById("root");
if (rootEl) {
  ReactDOM.createRoot(rootEl).render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}