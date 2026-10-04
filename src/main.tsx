import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import "@/styles/original/tailwind.css";
import "@/styles/original/fonts.css";
import "@/styles/original/source-styles.css";
import "@/styles/original/accessibility-mobile.css";

const root = document.getElementById("root");
if (!root) throw new Error("The application root is missing.");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
