import { defineConfig } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
  },
  plugins: [
    {
      name: 'copy-static-assets',
      closeBundle() {
        const distDir = path.resolve(process.cwd(), 'dist');
        const scriptSrc = path.resolve(process.cwd(), 'script.js');
        if (fs.existsSync(scriptSrc) && fs.existsSync(distDir)) {
          fs.copyFileSync(scriptSrc, path.join(distDir, 'script.js'));
        }
        const assetsSrc = path.resolve(process.cwd(), 'ASSETS');
        const assetsDest = path.join(distDir, 'ASSETS');
        if (fs.existsSync(assetsSrc) && fs.existsSync(distDir)) {
          fs.cpSync(assetsSrc, assetsDest, { recursive: true });
        }
      },
    },
  ],
});
