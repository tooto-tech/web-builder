import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const source = readFileSync(fileURLToPath(new URL('../../../../../../../../packages/webbuilder-plugins/src/components-basic/registries/section/servicesThb/index.ts', import.meta.url)), 'utf8')

describe('Service THB component', () => {
  it('exposes link traits for each service item', () => {
    expect(source).toContain('makeLinkTrait')
    expect(source).toContain("name: 'thbServiceLinkUrl'")
    expect(source).toContain("makeLinkTargetTrait({ label: '打开方式', name: 'thbServiceLinkTarget' })")
  })

  it('renders service cards as clickable anchors with safe blank-target links', () => {
    expect(source).toContain("tagName: 'a'")
    expect(source).toContain("syncCardLinkAttributes(findChildByClass(model, 'services__card'), item)")
    expect(source).toContain("attrs.rel = 'noopener noreferrer'")
  })
})
