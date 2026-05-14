import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',

      manifest: {
        name: 'Trackly',
        short_name: 'Trackly',
        description: 'Track attendance, salary, and work hours.',
        theme_color: '#0f172a',

        icons: [
          {
            src: '/trackly-logo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/trackly-logo.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
    }),
  ],
})