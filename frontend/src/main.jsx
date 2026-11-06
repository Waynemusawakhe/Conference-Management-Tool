import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AccessibilityTools from "./components/AccessibilityTools";
import AccessibleRouteFocus from "./components/AccessibleRouteFocus";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AccessibleRouteFocus />
        <AccessibilityTools />
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
