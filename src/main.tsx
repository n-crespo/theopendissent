import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "@fontsource-variable/source-serif-4/wght.css";
import "@fontsource-variable/source-serif-4/wght-italic.css";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext";
import { ModalProvider } from "./context/ModalContext";
import { PwaProvider } from "./context/PwaContext";
import { toast } from "./lib/toast";

// expose toasts in dev so they can be triggered from the console,
// e.g. toast.info({ title: "Hello", description: "..." })
if (import.meta.env.DEV) {
  (window as unknown as { toast: typeof toast }).toast = toast;
}

// Service Worker Registration
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <PwaProvider>
            <ModalProvider>
              <App />
            </ModalProvider>
          </PwaProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>,
);
