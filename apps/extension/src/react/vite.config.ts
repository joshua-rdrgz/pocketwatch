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
        content: path.resolve(__dirname, './content/index.html'),
        sidepanel: path.resolve(__dirname, './sidepanel/index.html'),
      },
      output: {
        entryFileNames: (preRenderedChunk) => {
          const pathName = preRenderedChunk.facadeModuleId?.split('/').at(-2);

          console.log('PATH NAME: ', pathName);

          return pathName ? `${pathName}/[name].js` : '[name].js';
        },
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          // assetInfo.names = [ '[type].css' ]
          const assetName = assetInfo.names[0]?.split('.')?.[0];

          if (assetName === 'content' || assetName === 'sidepanel') {
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
