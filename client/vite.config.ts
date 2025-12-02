import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 루트 디렉토리의 .env 파일 로드
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  const clientPort = parseInt(env.CLIENT_PORT || '3001', 10);
  
  return {
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/app': path.resolve(__dirname, './src/app'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/assets': path.resolve(__dirname, './src/assets'),
    },
  },
  server: {
    port: clientPort,
    strictPort: true, // 포트가 사용 중이면 에러 발생
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
        rewrite: (path) => {
          // /api/ai-suggestion/* -> /ai/*
          if (path.startsWith('/api/ai-suggestion/')) {
            return path.replace('/api/ai-suggestion/', '/ai/');
          }
          // /api/* -> /* (다른 API 경로)
          return path.replace(/^\/api/, '');
        },
      },
    },
  },
  build: {
    outDir: 'build',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['react-hot-toast', 'react-icons', 'react-select'],
          'vendor-state': ['zustand'],
        },
      },
    },
  },
  };
});

