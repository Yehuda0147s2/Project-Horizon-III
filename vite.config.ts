import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type UserConfig } from 'vite';

const rootDir = fileURLToPath(new URL('.', import.meta.url));
const certDir = path.join(rootDir, '.certs');
const certPath = path.join(certDir, 'localhost.pem');
const keyPath = path.join(certDir, 'localhost-key.pem');
const hasLocalCert = fs.existsSync(certPath) && fs.existsSync(keyPath);

export default defineConfig((): UserConfig => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': rootDir,
    },
  },
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
    ...(hasLocalCert
      ? {
          https: {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath),
          },
        }
      : {}),
  },
  preview: {
    host: 'localhost',
    port: 4173,
    strictPort: true,
  },
}));
