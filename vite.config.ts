import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // adds support for importing svgs as strings
  assetsInclude: ["**/*.svg"],
});
