import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuração do Vite — empacotador do projeto
export default defineConfig({
  plugins: [react()],
  build: {
    // Divide as bibliotecas grandes em arquivos separados para
    // carregamento mais rápido em hardware modesto (totem)
    rollupOptions: {
      output: {
        manualChunks: {
          firebase: ['firebase/app', 'firebase/database'],
          recharts: ['recharts'],
        },
      },
    },
  },
});
