import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vuetify from 'vite-plugin-vuetify'
import monacoEditorPlugin from 'vite-plugin-monaco-editor'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const pkg = require('./package.json')
const siteConfig = require('./src/common/config.js')

const monaco = (monacoEditorPlugin as unknown as { default: typeof monacoEditorPlugin }).default ?? monacoEditorPlugin

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  process.env.VUE_APP_VERSION = pkg.version
  const assetsDir = `${siteConfig.urlPrefix}/static`.replace(/^\/*/g, '')

  return {
    base: siteConfig.urlPrefix ? `${siteConfig.urlPrefix}/` : '/',
    define: {
      'process.env.VUE_APP_VERSION': JSON.stringify(pkg.version),
      'process.env.BASE_URL': JSON.stringify(siteConfig.urlPrefix ? `${siteConfig.urlPrefix}/` : '/'),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    },
    build: {
      assetsDir,
      sourcemap: false,
      chunkSizeWarningLimit: 2000
    },
    server: {
      port: 8080,
      proxy: env.VITE_API_PROXY_TARGET
        ? {
            '/api': {
              target: env.VITE_API_PROXY_TARGET,
              changeOrigin: true
            }
          }
        : undefined
    },
    plugins: [
      vue(),
      vueJsx(),
      vuetify({ autoImport: true }),
      monaco({
        languageWorkers: ['editorWorkerService', 'typescript', 'html'],
        customWorkers: [],
        publicPath: `${assetsDir}/monaco`
      }),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Roselia Blog',
          short_name: 'Roselia',
          theme_color: '#6670ed',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            { src: '/favicon.png', sizes: '192x192', type: 'image/png' },
            { src: '/favicon.png', sizes: '512x512', type: 'image/png' }
          ]
        }
      })
    ]
  }
})
