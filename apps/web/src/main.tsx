import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { configureAmplify } from "./lib/amplify";
import { loadRuntimeConfig } from "./lib/runtime-config";
import "./styles.css";

const config = await loadRuntimeConfig();
configureAmplify(config);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App config={config} />
  </StrictMode>
);
