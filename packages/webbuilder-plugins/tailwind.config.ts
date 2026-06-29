import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config } from 'tailwindcss'

const packageDir = dirname(fileURLToPath(import.meta.url))

export default {
  content: [
    resolve(packageDir, 'src/**/*.{vue,js,ts,jsx,tsx}'),
  ],
  plugins: [],
} satisfies Config
