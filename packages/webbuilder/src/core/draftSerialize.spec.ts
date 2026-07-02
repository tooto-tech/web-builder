import { describe, expect, it, vi } from 'vitest'

import {
  buildDraftSaveRequest,
  getDraftUpdateTime,
  parseDraftProjectData,
  serializeDraftProjectData,
} from './draftSerialize.js'

describe('draftSerialize', () => {
  it('serializes editor project data and collects used component types', () => {
    const editor = {
      getProjectData: vi.fn(() => ({
        pages: [
          {
            component: {
              type: 'wrapper',
              components: [
                { type: 'wb-hero' },
                '<section data-gjs-type="wb-html-section"></section>',
              ],
            },
          },
        ],
      })),
    }

    const result = serializeDraftProjectData(editor)

    expect(editor.getProjectData).toHaveBeenCalledTimes(1)
    expect(result.schemaJson).toContain('wb-hero')
    expect([...result.usedComponentTypes].sort()).toEqual(['wb-hero', 'wb-html-section'])
  })

  it('throws a clear error when the editor cannot provide project data', () => {
    expect(() => serializeDraftProjectData({})).toThrow('Editor project data is unavailable')
  })

  it('parses blank and invalid draft schema safely', () => {
    expect(parseDraftProjectData('')).toEqual({ projectData: null, error: null })

    const parsed = parseDraftProjectData('{')
    expect(parsed.projectData).toBeNull()
    expect(parsed.error).toBeInstanceOf(Error)
  })

  it('builds draft save requests from resource identity and save metadata', () => {
    expect(buildDraftSaveRequest({
      resource: {
        resourceId: 7,
        resourceType: 'PAGE',
        resourceScope: 'OWNED',
      },
      resourceName: 'Home',
      schemaJson: '{"pages":[]}',
      baseUpdateTime: '2026-07-02T12:00:00.000Z',
      sessionKey: 'session-1',
      forceOverride: true,
    })).toEqual({
      resourceId: 7,
      resourceType: 'PAGE',
      resourceScope: 'OWNED',
      resourceName: 'Home',
      schemaJson: '{"pages":[]}',
      baseUpdateTime: '2026-07-02T12:00:00.000Z',
      sessionKey: 'session-1',
      forceOverride: true,
    })
  })

  it('reads update timestamps from host draft records', () => {
    expect(getDraftUpdateTime({ updateTime: '2026-07-02T12:00:00.000Z' })).toBe(
      '2026-07-02T12:00:00.000Z',
    )
    expect(getDraftUpdateTime({ updatedAt: '2026-07-02T12:01:00.000Z' })).toBe(
      '2026-07-02T12:01:00.000Z',
    )
    expect(getDraftUpdateTime(null)).toBeUndefined()
  })
})
