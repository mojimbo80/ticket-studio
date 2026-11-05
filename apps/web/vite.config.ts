import react from '@vitejs/plugin-react';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  // Le plugin du routeur doit précéder le plugin React pour générer l'arbre de routes avant la compilation.
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
