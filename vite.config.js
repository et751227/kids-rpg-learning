import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // ✅ 改成相對路徑，確保在 Vercel 上正確載入 JS/CSS
});
