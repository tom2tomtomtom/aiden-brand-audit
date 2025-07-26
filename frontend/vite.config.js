import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Bundle optimization
    target: 'es2015',
    minify: 'esbuild',
    // Drop console logs in production
    esbuild: {
      drop: ['console', 'debugger'],
    },
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Vendor chunk for stable third-party libraries
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
          ],
          // UI components chunk - only include installed packages
          ui: [
            'lucide-react',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-progress',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          // Charts and visualizations
          charts: ['recharts'],
          // Utils and state management
          utils: ['zustand', 'clsx', 'tailwind-merge', 'zod'],
          // Heavy features that can be lazy loaded
          analytics: ['framer-motion'],
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
          if (facadeModuleId) {
            const name = path.basename(facadeModuleId, path.extname(facadeModuleId))
            return `chunks/${name}-[hash].js`
          }
          return 'chunks/[name]-[hash].js'
        },
        assetFileNames: (assetInfo) => {
          const extType = path.extname(assetInfo.name).substring(1)
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`
          }
          if (/css/i.test(extType)) {
            return `assets/css/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
      },
      // External dependencies that should not be bundled
      external: (id) => {
        // Keep all dependencies bundled for easier deployment
        return false
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Source maps for production debugging (can be disabled for smaller builds)
    sourcemap: false,
  },
  // Optimization for development
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      'zustand',
      'clsx',
      'tailwind-merge',
    ],
  },
})
