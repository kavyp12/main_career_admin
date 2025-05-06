import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow external access
    port: 5173, // Set the port
    strictPort: true, // Ensure it uses the defined port
    allowedHosts: ['careerguide.enhc.tech'], // Allow your domain
    proxy: {
      '/api': {
        target: 'https://api.enhc.tech',
        changeOrigin: true
      }
    }
  }
});

