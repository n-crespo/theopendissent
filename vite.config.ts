import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // ensures assets are served from the root
  base: "/",
  // adds support for importing svgs as strings
  assetsInclude: ["**/*.svg"],
});
