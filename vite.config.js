import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: false,
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Example: Ensure CSP is set for HTML entry points
        // This is a simplified example and might need more robust handling
        // based on your specific build process and server setup.
        // For a more complete solution, consider a dedicated CSP plugin
        // or server-side configuration.
        // You might need to adjust this based on how your index.html is served.
        // This part is more conceptual for Vite's build output.
        // For actual CSP, server headers are usually more effective.
      },
    },
  },
  preview: {
    headers: {
      'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self' ws:;",
    },
  },
})
