
import { defineConfig } from 'vite'
import { readFileSync, existsSync } from 'node:fs'

const keyPath = './192.168.1.66+2-key.pem'
const certPath = './192.168.1.66+2.pem'

const hasCertificates = existsSync(keyPath) && existsSync(certPath)

export default defineConfig({
  base: '/VisionTranslate2.0/',
  server: {
    host: '0.0.0.0',
    ...(hasCertificates && {
      https: {
        key: readFileSync(keyPath),
        cert: readFileSync(certPath),
      },
    }),
  },
})
