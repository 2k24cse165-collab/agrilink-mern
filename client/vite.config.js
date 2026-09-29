import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite dev server proxies /api → http://localhost:5000 (server)
// so the client can call relative URLs and stay on the same origin.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:5000",
      "/health": "http://localhost:5000",
    },
  },
});
