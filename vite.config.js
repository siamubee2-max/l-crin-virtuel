import sdkPlugin from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error',
  plugins: [
    sdkPlugin({
      legacySDKImports: process.env.LEGACY_SDK_IMPORTS === 'true'
    }),
    react(),
  ]
});