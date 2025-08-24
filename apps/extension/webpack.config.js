import path from 'path';
import { fileURLToPath } from 'url';
import CopyPlugin from 'copy-webpack-plugin';
import webpack from 'webpack';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const monorepoRoot = path.resolve(__dirname, '../..');

// Load environment variables from .env files
const envFiles = ['.env.local', '.env'];

const envVars = {};
envFiles.forEach((envFile) => {
  if (fs.existsSync(envFile)) {
    const parsed = dotenv.config({ path: envFile }).parsed || {};
    Object.assign(envVars, parsed);
  }
});

// Create define plugin env object with proper JSON stringification
const defineEnv = {};
Object.keys(envVars).forEach((key) => {
  defineEnv[`process.env.${key}`] = JSON.stringify(envVars[key]);
});

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
    new webpack.DefinePlugin(defineEnv),
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
