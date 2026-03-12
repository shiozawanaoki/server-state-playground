import { defineConfig } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  server: {
    port: 3001,
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths(),
    tanstackStart(),
    // react plugin must come after tanstackStart
    viteReact(),
  ],
})
