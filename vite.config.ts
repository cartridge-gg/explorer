import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dynamicLinksPlugin from "./dynamic-link";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), process.env.IS_EMBEDDED ? dynamicLinksPlugin() : null],
  server: {
    port: process.env.NODE_ENV === "development" ? 3004 : undefined,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Split Monaco Editor into a separate chunk
          "monaco-editor": [
            "monaco-editor",
            "@monaco-editor/react",
            "@monaco-editor/loader",
          ],
          // Group vendor libraries
          vendor: ["react", "react-dom"],
        },
      },
    },
    // This ensures chunks are loaded only when needed
    chunkSizeWarningLimit: 1000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@modules": path.resolve(__dirname, "./src/modules"),
      "@constants": path.resolve(__dirname, "./src/constants"),
    },
  },
  define: {
    "import.meta.env.VITE_IS_EMBEDDED": JSON.stringify(process.env.IS_EMBEDDED),
  },
  preview: {
    allowedHosts: ["x.cartridge.gg"],
  },
});
