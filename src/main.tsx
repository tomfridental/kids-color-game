import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

declare const __APP_VERSION__: string;

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
    <span className="fixed bottom-2 left-2 text-md text-gray-400 pointer-events-none select-none">
      v{__APP_VERSION__}
    </span>
  </StrictMode>
);
