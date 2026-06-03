import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const source = readFileSync(
  fileURLToPath(new URL('./index.ts', import.meta.url)),
  'utf-8',
)

describe('inquiry form package source boundaries', () => {
  it('does not publish host API paths or tenant headers as package defaults', () => {
    expect(source).not.toContain('/app-api')
    expect(source).not.toContain('tenant-id')
  })
})
