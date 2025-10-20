import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    minify: "terser", // 改用 terser 壓縮器
    terserOptions: {
      mangle: {
        reserved: [
          "BrowserRouter",
          "HashRouter",
          "Routes",
          "Route" // ⚠️ 關鍵：保留這幾個詞不被壓縮掉
        ],
      },
    },
  },
});
