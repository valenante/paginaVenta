import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { TenantProvider } from "./context/TenantContext";
import { ConfigProvider } from "./context/ConfigContext";
import { ToastProvider } from "./context/ToastContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <TenantProvider>
          <AuthProvider>
            <ConfigProvider>
              <App />
            </ConfigProvider>
          </AuthProvider>
        </TenantProvider>
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>
);
