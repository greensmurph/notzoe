import { defineConfig } from 'vite';
import { resolve } from 'path';
import * as fs from 'fs';
import { glob } from 'glob';

// Function to copy additional assets that might not be directly referenced
function copyAssets() {
  // Create directories if they don't exist
  const targetAudioDir = resolve(__dirname, 'dist/audio');
  
  if (!fs.existsSync(targetAudioDir)) {
    fs.mkdirSync(targetAudioDir, { recursive: true });
  }
}

export default defineConfig({
  // Base public path when served in production
  base: './',
  
  // Configure the build
  build: {
    // Output directory for the build
    outDir: 'dist',
    
    // Don't empty the output directory before building to preserve audio files
    emptyOutDir: false,
    
    // Configure asset handling
    assetsInlineLimit: 4096, // 4kb - files smaller than this will be inlined as base64
    
    // Configure rollup options
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  
  // Configure server options for development
  server: {
    port: 3000,
    open: true, // Auto-open browser on server start
  },
  
  // Configure preview server (for previewing the build)
  preview: {
    port: 8080,
  },
  
  // Custom plugins
  plugins: [
    {
      name: 'copy-assets',
      closeBundle() {
        copyAssets();
      }
    }
  ]
});
