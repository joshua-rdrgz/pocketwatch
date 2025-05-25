import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    outDir: path.resolve(__dirname, '../../dist/react'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        'browser-panel': path.resolve(__dirname, './browser-panel/index.html'),
        'side-panel': path.resolve(__dirname, './side-panel/index.html'),
      },
      output: {
        entryFileNames: (preRenderedChunk) => {
          // pathName = browser-panel || side-panel
          const pathName = preRenderedChunk.facadeModuleId?.split('/').at(-2);
          return pathName ? `${pathName}/[name].js` : '[name].js';
        },
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          // assetInfo.names = [ '[browser-panel || side-panel].css' ]
          const assetName = assetInfo.names[0]?.split('.')?.[0];

          if (assetName === 'browser-panel' || assetName === 'side-panel') {
            return `${assetName}/[name].[ext]`;
          }

          return '[name].[ext]';
        },
      },
    },
  },
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
