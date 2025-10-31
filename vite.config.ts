
import react from '@vitejs/plugin-react-swc'
import { defineConfig, UserConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  let build: UserConfig['build'], esbuild: UserConfig['esbuild'], define: UserConfig['define']

  if (mode === 'development') {
    build = {
      minify: false,
    }

    esbuild = {
      jsxDev: true,
    }

    define = {
      'process.env.NODE_ENV': '"development"',
      __DEV__: 'true',
    }
  } else {
    // Production build configuration
    build = {
      rollupOptions: {
        external: ['@portone/browser-sdk/v2']
      }
    }
  }

  return {
    plugins: [react()],
    build,
    esbuild,
    define: {
      ...define,
      global: 'globalThis',
    },
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
    server: {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  }
})

