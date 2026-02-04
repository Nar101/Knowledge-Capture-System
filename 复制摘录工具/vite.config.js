import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: './',
  plugins: [react()],
  root: path.resolve(__dirname, 'src/renderer'),
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        capture: path.resolve(__dirname, 'src/renderer/capture/index.html'),
        library: path.resolve(__dirname, 'src/renderer/library/index.html')
      }
    }
  }
});
