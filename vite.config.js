import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const BUILD_VERSION = Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6)

export default defineConfig(() => ({
  define: {
    __BUILD_VERSION__: JSON.stringify(BUILD_VERSION)
  },
  plugins: [
    react(),
    {
      name: 'write-version-json',
      renderChunk(code) {
        if (code.includes('__BUILD_VERSION__')) {
          return code.replace(/__BUILD_VERSION__/g, BUILD_VERSION)
        }
      },
      closeBundle() {
        const outDir = path.resolve(__dirname, 'dist')
        if (!fs.existsSync(outDir)) return
        const versionData = {
          version: BUILD_VERSION,
          build_time: new Date().toISOString()
        }
        fs.writeFileSync(
          path.join(outDir, 'version.json'),
          JSON.stringify(versionData, null, 2)
        )
        // Also update index.html with the build version
        const indexPath = path.join(outDir, 'index.html')
        if (fs.existsSync(indexPath)) {
          let html = fs.readFileSync(indexPath, 'utf-8')
          html = html.replace(/__BUILD_VERSION__/g, BUILD_VERSION)
          fs.writeFileSync(indexPath, html)
        }
      }
    }
  ],
  base: '/',
}))
