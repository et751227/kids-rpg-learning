import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // ✅ 用相對路徑，確保 Hash 模式能正確載入
  build: {
    minify: "terser", // ✅ 使用 terser，避免 esbuild 壓縮出錯
    terserOptions: {
      mangle: {
        reserved: [
          "HashRouter",
          "BrowserRouter",
          "Routes",
          "Route"
        ],
      },
    },
  },
});
