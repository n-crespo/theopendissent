import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // ensures assets are served from the root
  base: "/",
  // adds support for importing svgs as strings
  assetsInclude: ["**/*.svg"],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Put all Firebase code in its own file
          if (id.includes("node_modules/firebase")) {
            return "firebase";
          }
          // Put React and Router in their own file
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/react-router")
          ) {
            return "react-vendor";
          }
          // Put Framer Motion in its own file
          if (id.includes("node_modules/framer-motion")) {
            return "framer";
          }
        },
      },
    },
  },
});
