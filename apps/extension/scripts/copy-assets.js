import fs from 'fs-extra';
import path from 'path';
import chokidar from 'chokidar';

const srcDir = path.resolve('src');
const distDir = path.resolve('dist');
const rootDir = path.resolve('.');

// Files to copy from the root directory
const rootFiles = ['manifest.json'];

// File extensions to copy from src directory
const extensions = ['.css', '.html'];

// Copy a single file
async function copyFile(src, dest) {
  try {
    await fs.ensureDir(path.dirname(dest));
    await fs.copy(src, dest);
    console.log(
      `Copied: ${path.relative('.', src)} → ${path.relative('.', dest)}`
    );
  } catch (err) {
    console.error(`Error copying ${src}: ${err}`);
  }
}

// Copy all relevant files
async function copyAssets() {
  try {
    // Create dist directory if it doesn't exist
    await fs.ensureDir(distDir);

    // Copy root files (like manifest.json)
    for (const file of rootFiles) {
      const srcFile = path.join(rootDir, file);
      const destFile = path.join(distDir, file);
      if (await fs.pathExists(srcFile)) {
        await copyFile(srcFile, destFile);
      }
    }

    // Copy files with specified extensions from src directory
    const files = await fs.readdir(srcDir, { withFileTypes: true });
    for (const file of files) {
      const srcFile = path.join(srcDir, file.name);

      // Skip directories and only process files with specified extensions
      if (!file.isDirectory() && extensions.includes(path.extname(file.name))) {
        const destFile = path.join(distDir, file.name);
        await copyFile(srcFile, destFile);
      }
    }

    console.log('Asset copying complete!');
  } catch (err) {
    console.error(`Error copying assets: ${err}`);
  }
}

// Check if watch mode is enabled
const isWatchMode = process.argv.includes('--watch');

if (isWatchMode) {
  console.log('Watching for file changes...');

  // Watch root files
  rootFiles.forEach((file) => {
    const filePath = path.join(rootDir, file);
    chokidar.watch(filePath).on('all', (event, filepath) => {
      if (event === 'add' || event === 'change') {
        const destFile = filepath.replace(rootDir, distDir);
        copyFile(filepath, destFile);
      }
    });
  });

  // Watch src directory for relevant file extensions
  const watchPattern = extensions.map((ext) => path.join(srcDir, `*${ext}`));
  console.log(`Watching patterns: ${watchPattern.join(', ')}`);

  chokidar.watch(watchPattern).on('all', (event, filepath) => {
    if (event === 'add' || event === 'change') {
      console.log(`Event: ${event}, File: ${filepath}`);
      const destFile = filepath.replace(srcDir, distDir);
      copyFile(filepath, destFile);
    }
  });
} else {
  // Run once and exit
  copyAssets();
}
