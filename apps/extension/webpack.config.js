import path from 'path';
import { fileURLToPath } from 'url';
import CopyPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const monorepoRoot = path.resolve(__dirname, '../..');

export default {
  mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
  entry: {
    'browser-panel': './src/browser-panel.ts',
    // 'app-settings-worker': './src/app-settings-worker.ts',
    // 'stopwatch-worker': './src/stopwatch-worker.ts',
    'service-worker': './src/service-worker.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              compilerOptions: {
                module: 'ESNext',
                moduleResolution: 'bundler',
              },
            },
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@repo/ui': path.resolve(monorepoRoot, 'packages/ui'),
    },
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: '.' },
        { from: 'src/*.css', to: '[name][ext]' },
        { from: 'assets', to: 'assets' },
      ],
    }),
  ],
  devtool: process.env.NODE_ENV === 'production' ? false : 'inline-source-map',
};
