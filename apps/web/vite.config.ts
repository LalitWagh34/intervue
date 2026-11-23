import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-markdown") || id.includes("remark-") || id.includes("micromark")) return "vendor-markdown";
          if (id.includes("framer-motion")) return "vendor-motion";
          if (id.includes("@tanstack")) return "vendor-query";
          if (id.includes("radix") || id.includes("cmdk")) return "vendor-ui";
        },
      },
    },
  },
  server: {
    port: 5173,
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp",
    },
  },
});
