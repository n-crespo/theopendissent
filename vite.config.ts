import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd()), ...process.env };
  // preview auth fakes login, so refuse to ship it to production
  if (env.VITE_PREVIEW_AUTH === "true" && env.VERCEL_ENV === "production") {
    throw new Error("VITE_PREVIEW_AUTH must not be enabled in production");
  }

  return {
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
  };
});
