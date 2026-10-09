import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// /api/* is proxied to the Express server so the browser sees one origin.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        rewrite: (path) => path.replace(/^\/api/, ""),
      },
    },
  },
});
