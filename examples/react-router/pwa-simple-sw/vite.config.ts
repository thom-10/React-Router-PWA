import { defineConfig } from 'vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { reactRouter } from '@react-router/dev/vite'
import { ReactRouterVitePWA } from '@vite-pwa/remix'

export const { ReactRouterVitePWAPlugin } = ReactRouterVitePWA()

// for testing purposes only
const usingRemixSW = process.env.PLAIN_SW !== 'true'
// for testing purposes only
const virtualPwaModule = process.env.VIRTUAL_PWA_MODULE !== 'false'

process.env.VITE_VIRTUAL_PWA_MODULE = virtualPwaModule.toString()
process.env.VITE_PUBLIC_VIRTUAL_PWA_MODULE = process.env.VITE_VIRTUAL_PWA_MODULE
process.env.VITE_BUILD_DATE = JSON.stringify(new Date().toISOString())

export default defineConfig({
  // for testing purposes only
  define: {
    VITE_VIRTUAL_PWA_MODULE: process.env.VITE_VIRTUAL_PWA_MODULE,
    VITE_PUBLIC_VIRTUAL_PWA_MODULE: process.env.VITE_VIRTUAL_PWA_MODULE,
    VITE_BUILD_DATE: process.env.VITE_BUILD_DATE,
  },
  plugins: [
    reactRouter(),
    tsconfigPaths(),
    ReactRouterVitePWAPlugin({
      srcDir: 'app',
      strategies: 'injectManifest',
      // for testing purposes only
      filename: usingRemixSW ? 'sw.ts' : 'plain-sw.ts',
      base: '/',
      registerType: 'autoUpdate',
      // for testing purposes only
      injectRegister: usingRemixSW || virtualPwaModule ? false : 'auto',
      manifest: {
        name: 'Remix PWA',
        short_name: 'Remix PWA',
        theme_color: '#ffffff',
        start_url: '/',
        display: 'standalone',
        icons: [{
          src: 'pwa-64x64.png',
          sizes: '64x64',
          type: 'image/png',
        }, {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png',
        }, {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png',
        }, {
          src: 'maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable',
        }],
        edge_side_panel: {
          preferred_width: 480,
        },
      },
      injectManifest: {
        globPatterns: ['**/*.{js,html,css,png,svg,ico}'],
        // for testing purposes only
        minify: false,
        // for testing purposes only
        enableWorkboxModulesLogs: true,
      },
      devOptions: {
        enabled: true,
        type: 'module',
        suppressWarnings: true,
      },
      swOptions: {
        injectManifest: {
          // for testing purposes only
          clientsClaimMode: usingRemixSW ? (virtualPwaModule ? true : 'auto') : undefined,
        },
      },
    }),
  ],
})
