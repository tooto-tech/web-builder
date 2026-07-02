import { describe, expect, it, vi } from 'vitest'

import {
  loadRulePageOptions,
  toRulePageOptions,
  type RulePageListParams,
  type RulePageListResult,
} from '../../../../../../packages/webbuilder-plugins/src/layout-templates/utils/layoutRulePages'

type TestPageRow = { resourceKey?: string; resourceName?: string }

describe('layoutRulePages', () => {
  it('normalizes page rows into unique selectable options', () => {
    expect(
      toRulePageOptions([
        { resourceKey: 'page.about', resourceName: 'About' },
        { resourceKey: 'page.home', resourceName: 'Home' },
        { resourceKey: 'page.home', resourceName: 'Homepage' },
        { resourceKey: '   ', resourceName: 'Invalid' },
      ])
    ).toEqual([
      { id: 'page.about', label: 'About' },
      { id: 'page.home', label: 'Home' },
    ])
  })

  it('loads selectable pages across all layout rule target resource types', async () => {
    const fetchPageList = vi.fn(
      async (params: RulePageListParams): Promise<RulePageListResult> => ({
        list:
          params.resourceType === 'TEMP_POST_DETAIL'
            ? [{ resourceKey: 'post.detail', resourceName: 'Post Detail' } as TestPageRow]
            : [],
      })
    )

    await expect(loadRulePageOptions(fetchPageList)).resolves.toEqual([
      { id: 'post.detail', label: 'Post Detail' },
    ])

    expect(fetchPageList).toHaveBeenCalledTimes(7)
    expect(fetchPageList.mock.calls.map(([params]) => params.resourceType)).toEqual([
      'PAGE',
      'TEMP_POST_DETAIL',
      'TEMP_POST_CATEGORY_LIST',
      'TEMP_PRODUCT_DETAIL',
      'TEMP_PRODUCT_CATEGORY_LIST',
      'TEMP_MEDIA_DETAIL',
      'TEMP_MEDIA_CATEGORY_LIST',
    ])
    fetchPageList.mock.calls.forEach(([params]) => {
      expect(params).toMatchObject({
        pageNo: 1,
        pageSize: 200,
        status: 'draft',
      })
    })
  })
})
