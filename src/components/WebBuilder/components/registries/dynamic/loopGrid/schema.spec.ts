import { describe, expect, it } from 'vitest'
import { DEFAULT_LOOP_GRID_SCHEMA } from './types'
import {
  encodeLoopGridSchema,
  normalizeLoopGridSchema,
  parseLoopGridSchema,
  validateLoopGridSchema
} from './schema'

describe('loop grid schema', () => {
  it('parses a valid encoded schema', () => {
    const schema = {
      ...DEFAULT_LOOP_GRID_SCHEMA,
      gridId: 'featured-posts',
      layout: {
        ...DEFAULT_LOOP_GRID_SCHEMA.layout,
        columns: 4
      }
    }

    expect(parseLoopGridSchema(encodeLoopGridSchema(schema))).toMatchObject({
      ...schema,
      layout: {
        ...schema.layout,
        loopCarousel: false,
        carouselItemWidth: 360,
        carouselArrowPosition: 50
      }
    })
  })

  it('rejects schemas with missing required fields', () => {
    const schema = {
      ...DEFAULT_LOOP_GRID_SCHEMA,
      query: undefined
    }

    expect(() => validateLoopGridSchema(schema)).toThrow('query')
  })

  it('rejects bad JSON', () => {
    expect(() => parseLoopGridSchema('%7Bbad-json')).toThrow('Invalid loop grid schema JSON')
  })

  it('normalizes defaults for partial schema input', () => {
    const schema = normalizeLoopGridSchema({
      gridId: 'legacy-grid',
      layout: {
        columns: '99',
        itemsPerPage: '',
        columnGap: -8,
        rowGap: '32'
      },
      pagination: {
        mode: 'invalid',
        pageLimit: '0'
      },
      filterState: {
        category: 'news, updates',
        currentPage: 'bad'
      }
    })

    expect(schema.gridId).toBe('legacy-grid')
    expect(schema.layout).toMatchObject({
      columns: 6,
      itemsPerPage: DEFAULT_LOOP_GRID_SCHEMA.layout.itemsPerPage,
      columnGap: 0,
      rowGap: 32
    })
    expect(schema.pagination).toEqual({
      mode: DEFAULT_LOOP_GRID_SCHEMA.pagination.mode,
      pageLimit: 1
    })
    expect(schema.filterState.category).toEqual(['news', 'updates'])
    expect(schema.filterState.currentPage).toBe(DEFAULT_LOOP_GRID_SCHEMA.filterState.currentPage)
    expect(schema.advanced.hostRenderMode).toBe(DEFAULT_LOOP_GRID_SCHEMA.advanced.hostRenderMode)
  })
})
