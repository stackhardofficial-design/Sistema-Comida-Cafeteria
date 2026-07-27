import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'StackHard POS',
        short_name: 'StackHard',
        description: 'Sistema completo de punto de venta para restaurantes y cafeterías',
        theme_color: '#FAFAFA',
        background_color: '#FAFAFA',
        display: 'standalone',
        icons: [
          {
            src: '/logo-light.jpg',
            sizes: '192x192',
            type: 'image/jpeg',
            purpose: 'any maskable'
          },
          {
            src: '/logo-light.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
