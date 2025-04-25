import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dynamicLinksPlugin from "./dynamic-link";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), dynamicLinksPlugin()],
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
});
