import { defineConfig, loadEnv } from 'vite'
import path from 'path'
import crypto from 'crypto'
import vue from '@vitejs/plugin-vue'

// 兼容 Node 16 环境运行 Vite 6
if (!crypto.getRandomValues && crypto.webcrypto && crypto.webcrypto.getRandomValues) {
  crypto.getRandomValues = crypto.webcrypto.getRandomValues.bind(crypto.webcrypto)
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    // 使用相对路径或环境变量配置，支持部署在根目录或任意二级目录（如 /h5/）
    base: env.VITE_PUBLIC_PATH || './',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      },
      extensions: ['.mjs', '.js', '.jsx', '.json', '.vue']
    },
    build: {
      outDir: 'dist',
      assetsDir: 'static',
      sourcemap: false,
      rollupOptions: {
        output: {
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: 'static/[ext]/[name]-[hash].[ext]'
        }
      }
    },
    server: {
      port: 80,
      host: true,
      allowedHosts: true,
      open: false,
      proxy: {
        // 宴席主家验真 H5 免登录接口及数据字典接口代理（miniapp-auth 网关）
        '/rest': {
          // target: env.VITE_PROXY_TARGET || 'https://ec5apitest.swellfun.com',
          target: 'https://wechatapp5master.swellfun.com', // UAT 环境网关
          changeOrigin: true
        }
      }
    }
  }
})

