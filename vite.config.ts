import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // allows use of '@/assets/...' instead of relative paths
      "@": "/src",
    },
  },
});
