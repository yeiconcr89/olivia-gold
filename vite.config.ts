import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  build: {
    // Optimizaciones de build
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor libraries
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            // Router
            if (id.includes('react-router')) {
              return 'router';
            }
            // Icons
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // Other large libraries
            if (id.includes('date-fns') || id.includes('lodash')) {
              return 'utils';
            }
            // Default vendor chunk for smaller libraries
            return 'vendor';
          }
          
          // Admin components (large and rarely used)
          if (id.includes('AdminDashboard') || 
              id.includes('admin/') ||
              id.includes('AdminRoute') ||
              id.includes('BulkImport') ||
              id.includes('BulkOperations')) {
            return 'admin';
          }
          
          // Checkout flow (large but specific use case)
          if (id.includes('checkout/') || 
              id.includes('CheckoutFlow') ||
              id.includes('tracking/')) {
            return 'checkout';
          }
          
          // Product-related components (frequently used together)
          if (id.includes('ProductCard') ||
              id.includes('ProductGrid') ||
              id.includes('ProductModal') ||
              id.includes('ProductForm')) {
            return 'products';
          }
          
          // Auth components
          if (id.includes('LoginModal') ||
              id.includes('GoogleCallback') ||
              id.includes('AuthContext')) {
            return 'auth';
          }
        },
      },
    },
    // Configuración de chunks
    chunkSizeWarningLimit: 1000,
    // Minificación
    minify: 'esbuild',
    // Source maps para debugging en producción
    sourcemap: false,
  },
  server: {
    port: 5173,
    strictPort: true,
    // Habilitar historyApiFallback para client-side routing
    historyApiFallback: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  // Optimizaciones de desarrollo
  esbuild: {
    // Remover console.log en producción
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },
});
