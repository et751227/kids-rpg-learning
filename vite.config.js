import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // 🔹 確保靜態資源可正確載入
  build: {
    minify: "terser", // 🔹 指定用 terser 取代 esbuild 壓縮器
    terserOptions: {
      mangle: {
        // 🔹 保留這些關鍵詞，避免被壓縮成 undefined
        reserved: ["HashRouter", "BrowserRouter", "Routes", "Route", "React"],
      },
    },
  },
});
