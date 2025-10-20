import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// 這樣就可以了！
export default defineConfig({
  plugins: [react()],
  base: "./", 
});
