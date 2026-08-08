import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main:    resolve(__dirname, 'index.html'),
        study:   resolve(__dirname, 'study.html'),
        coding:  resolve(__dirname, 'coding.html'),
        general: resolve(__dirname, 'general.html'),
      }
    }
  }
})
