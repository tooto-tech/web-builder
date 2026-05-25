import { ref } from 'vue'
import type { PageSettings } from '../utils/pageSettings'
import { getPageSettingsFromPage, applyPageSettingsToPage } from '../utils/pageSettings'

export interface UsePageSettingsOptions {
  getSelectedPage: () => any
}

/**
 * 页面设置管理 composable
 */
export default function usePageSettings(options: UsePageSettingsOptions) {
  const { getSelectedPage } = options

  const showPageSettings = ref(false)
  const pageSettings = ref<PageSettings>({
    id: '',
    name: '',
    slug: '',
    tdkTitle: '',
    tdkDescription: '',
    tdkKeywords: '',
    customHead: '',
    customBody: '',
  })

  /**
   * 打开页面设置
   */
  const openPageSettings = () => {
    const page = getSelectedPage()
    pageSettings.value = getPageSettingsFromPage(page)
    showPageSettings.value = true
  }

  /**
   * 保存页面设置
   */
  const savePageSettings = (settings: PageSettings) => {
    const page = getSelectedPage()
    applyPageSettingsToPage(page, settings)
    pageSettings.value = settings
  }

  return {
    showPageSettings,
    pageSettings,
    openPageSettings,
    savePageSettings,
  }
}
