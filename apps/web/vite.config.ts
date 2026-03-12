import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Docker Compose should override this to http://api:8080 for container-to-container proxying.
const apiTarget = process.env.VITE_API_PROXY_TARGET || "http://localhost:8080";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true
      }
    }
  }
});
