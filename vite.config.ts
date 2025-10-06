import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import electron from 'vite-plugin-electron/simple';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(() => ({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main/index.ts',
        vite: {
          build: {
            outDir: path.join(rootDir, 'dist-electron/main'),
            emptyOutDir: false,
            target: 'node18',
            rollupOptions: {
              output: {
                entryFileNames: 'index.js',
                format: 'esm'
              },
              external: ['sql.js']
            }
          },
          resolve: {
            alias: {
              '@shared': path.resolve(rootDir, 'shared'),
              '@electron': path.resolve(rootDir, 'electron')
            }
          }
        }
      },
      preload: {
        input: {
          main: path.join(rootDir, 'electron/preload/index.ts')
        },
        vite: {
          build: {
            outDir: path.join(rootDir, 'dist-electron/preload'),
            emptyOutDir: false,
            target: 'node18',
            rollupOptions: {
              output: {
                entryFileNames: 'index.js',
                format: 'cjs'
              }
            }
          },
          resolve: {
            alias: {
              '@shared': path.resolve(rootDir, 'shared'),
              '@electron': path.resolve(rootDir, 'electron')
            }
          }
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@renderer': path.resolve(rootDir, 'src'),
      '@shared': path.resolve(rootDir, 'shared'),
      '@types': path.resolve(rootDir, 'types')
    }
  },
  build: {
    sourcemap: true
  }
}));
