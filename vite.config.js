
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

export default defineConfig({
  base: '/VisionTranslate2.0/',
  server: {
    host: '0.0.0.0',
    https: {
      key: readFileSync('./192.168.1.66+2-key.pem'),
      cert: readFileSync('./192.168.1.66+2.pem'),
    },
  },
})
