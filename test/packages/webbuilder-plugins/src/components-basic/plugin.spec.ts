import { describe, expect, it, vi } from 'vitest'
import type { Editor } from 'grapesjs'
import { componentsBasic } from '../../../../../packages/webbuilder-plugins/src/components-basic/plugin.js'
import type { ComponentRegistryExecutor } from '../../../../../packages/webbuilder-plugins/src/components-basic/registries/types.js'

const createRegistry = (
  id: string,
  register: ComponentRegistryExecutor['register'] = vi.fn(),
): ComponentRegistryExecutor => ({
  id,
  register,
})

describe('componentsBasic', () => {
  it('exposes Basic as a first-class always-enabled feature plugin', () => {
    const plugin = componentsBasic()

    expect(plugin).toMatchObject({
      id: 'components-basic',
      label: 'Basic Components',
      order: 10,
      alwaysEnabled: true,
    })
    expect(plugin.loadComponentTypes).toContain('wb-container')
    expect(plugin.insertComponentTypes).toContain('wb-container')
  })

  it('registers component registries in manifest order', () => {
    const editor = {} as Editor
    const first = createRegistry('container')
    const second = createRegistry('heading')

    componentsBasic({
      registries: [second, first],
      manifest: [
        { id: 'container', registeredTypes: ['wb-container'], failurePolicy: 'core' },
        { id: 'heading', registeredTypes: ['wb-heading'], failurePolicy: 'core' },
      ],
    }).activateEditor?.({ editor } as any)

    expect(first.register).toHaveBeenCalledBefore(second.register as any)
  })

  it('throws when a core registry fails', () => {
    const failure = new Error('boom')

    expect(() =>
      componentsBasic({
        registries: [createRegistry('container', () => { throw failure })],
        manifest: [
          { id: 'container', registeredTypes: ['wb-container'], failurePolicy: 'core' },
        ],
      }).activateEditor?.({ editor: {} as Editor } as any),
    ).toThrow('[WebBuilder Basic] Failed to register container: boom')
  })

  it('records optional registry failures and continues by default', () => {
    const onRegistrationFailure = vi.fn()
    const optional = createRegistry('historyTimeline', () => { throw new Error('optional') })
    const next = createRegistry('container')

    componentsBasic({
      onRegistrationFailure,
      registries: [optional, next],
      manifest: [
        { id: 'historyTimeline', registeredTypes: ['wb-history-timeline'], failurePolicy: 'optional' },
        { id: 'container', registeredTypes: ['wb-container'], failurePolicy: 'core' },
      ],
    }).activateEditor?.({ editor: {} as Editor } as any)

    expect(onRegistrationFailure).toHaveBeenCalledWith({
      registryId: 'historyTimeline',
      message: '[WebBuilder Basic] Optional registry historyTimeline failed: optional',
      error: expect.any(Error),
    })
    expect(next.register).toHaveBeenCalled()
  })

  it('rejects duplicate registered component types', () => {
    expect(() =>
      componentsBasic({
        registries: [createRegistry('container'), createRegistry('duplicateContainer')],
        manifest: [
          { id: 'container', registeredTypes: ['wb-container'], failurePolicy: 'core' },
          { id: 'duplicateContainer', registeredTypes: ['wb-container'], failurePolicy: 'core' },
        ],
      }),
    ).toThrow('Duplicate Basic registry type "wb-container"')
  })
})
