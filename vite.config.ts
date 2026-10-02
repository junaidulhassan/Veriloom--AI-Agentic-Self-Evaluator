import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: Number(env.VITE_DEV_PORT ?? 5173),
      strictPort: true,
    },
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom', 'react-router'],
            query: ['@tanstack/react-query', '@tanstack/react-table', '@tanstack/react-virtual'],
            motion: ['framer-motion'],
            recharts: ['recharts'],
            echarts: ['echarts', 'echarts-for-react'],
            markdown: ['react-markdown', 'remark-gfm', 'react-syntax-highlighter'],
          },
        },
      },
    },
  }
})
