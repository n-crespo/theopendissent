import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext";
import { ModalProvider } from "./context/ModalContext";
import { PwaProvider } from "./context/PwaContext";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <PwaProvider>
      <ModalProvider>
        <App />
      </ModalProvider>
    </PwaProvider>
  </AuthProvider>,
);
