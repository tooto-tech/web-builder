import { describe, expect, it, vi } from 'vitest'
import type { PagePageReqVO } from '@/api/content/page'
import { loadRulePageOptions, toRulePageOptions } from './layoutRulePages'

describe('layoutRulePages', () => {
  it('normalizes page rows into unique selectable options', () => {
    expect(
      toRulePageOptions([
        { resourceKey: 'page.about', resourceName: 'About' },
        { resourceKey: 'page.home', resourceName: 'Home' },
        { resourceKey: 'page.home', resourceName: 'Homepage' },
        { resourceKey: '   ', resourceName: 'Invalid' },
      ]),
    ).toEqual([
      { id: 'page.about', label: 'About' },
      { id: 'page.home', label: 'Home' },
    ])
  })

  it('loads selectable pages across all layout rule target resource types', async () => {
    const fetchPageList = vi
      .fn<[PagePageReqVO], Promise<{ total: number; list: Array<{ resourceKey?: string; resourceName?: string }> }>>()
      .mockImplementation(async (params) => ({
        total: params.resourceType === 'TEMP_POST_DETAIL' ? 1 : 0,
        list:
          params.resourceType === 'TEMP_POST_DETAIL'
            ? [{ resourceKey: 'post.detail', resourceName: 'Post Detail' }]
            : [],
      }))

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
