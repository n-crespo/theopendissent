import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles/index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js");
    // .then((registration) => {
    // console.log("SW registered: ", registration);
    // })
    // .catch((registrationError) => {
    // console.log("SW registration failed: ", registrationError);
    // });
  });
}

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}
