import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    ssr: true,
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'src/main.ts'),
        preload: path.resolve(__dirname, 'src/preload.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        format: 'cjs',
      },
      external: ['electron', 'better-sqlite3'],
    },
  },
});
