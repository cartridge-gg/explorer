import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
  base: process.env.BASE_PATH,

  // This allow us to set a custom base path for the application.
  // Required when it is exposed in the `katana` under a non-root base path (ie `/explorer`).
  //
  // See <src/App.tsx>.
  define: {
    "import.meta.env.APP_BASE_PATH": JSON.stringify(process.env.BASE_PATH),
  },
});
