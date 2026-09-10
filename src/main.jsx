import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./credit-form.css";
import "./refactor.css";
import EchoppeTogo from "./EchoppeTogo.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <EchoppeTogo />
  </StrictMode>,
);
