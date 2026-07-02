import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config } from 'tailwindcss'

const packageDir = dirname(fileURLToPath(import.meta.url))

export default {
  prefix: 'tw-',
  content: [
    resolve(packageDir, 'src/**/*.{vue,js,ts,jsx,tsx}'),
  ],
  // Chrome appearance values resolve through --wb-* CSS custom properties
  // (see src/vue/theme.ts); no bespoke palette entries are required.
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config
