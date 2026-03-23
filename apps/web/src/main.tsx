import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { AppSelectionProvider } from "./contexts/AppSelectionContext";
import { BrowserSessionProvider } from "./contexts/BrowserSessionContext";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserSessionProvider>
      <AppSelectionProvider>
        <App />
      </AppSelectionProvider>
    </BrowserSessionProvider>
  </React.StrictMode>,
);
