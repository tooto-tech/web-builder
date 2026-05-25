import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const source = readFileSync(fileURLToPath(new URL('./index.vue', import.meta.url)), 'utf-8')
const controllerBindings =
  source.match(/const\s*\{([\s\S]*?)\}\s*=\s*useWebBuilderController\(props\)/)?.[1] ?? ''

describe('WebBuilder index bindings', () => {
  it('exposes controller device bindings used by TopBar', () => {
    expect(source).toContain(':devices="devices"')
    expect(source).toContain(':selected-device="selectedDevice"')
    expect(source).toContain('@set-device="setDevice"')

    expect(controllerBindings).toMatch(/\bdevices\b/)
    expect(controllerBindings).toMatch(/\bselectedDevice\b/)
    expect(controllerBindings).toMatch(/\bsetDevice\b/)
  })
})
