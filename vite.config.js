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
        description: 'Installable DTR app for attendance, salary, and work hours.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#f4f8fb',
        theme_color: '#1fa7e8',
        categories: ['business', 'productivity', 'utilities'],

        icons: [
          {
            src: '/trackly-icon.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/trackly-icon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
