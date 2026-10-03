import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: '../dist',
    rollupOptions: {
      // The portfolio at /, and my hobby corner at /walk/: the walk along the water and the
      // same notes as one plain page.
      input: {
        main: 'index.html',
        walk: 'walk/index.html',
        walkPage: 'walk/page/index.html',
      },
    },
  }
})
