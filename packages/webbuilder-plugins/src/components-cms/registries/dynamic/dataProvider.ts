type LoadPage = (params: any) => Promise<any>
type LoadList = (params?: any) => Promise<any>

export interface WebBuilderDynamicDataProvider {
  pages: {
    loadList: LoadPage
    loadDraft: (params: any) => Promise<any>
    loadHistoryDetail: (id: number) => Promise<any>
  }
  posts: {
    loadPage: LoadPage
    loadDetail: (id: number) => Promise<any>
  }
  postCategories: {
    loadList: LoadList
  }
  faqCategories: {
    loadList: LoadList
  }
  faqItems: {
    loadList: LoadList
  }
  productCategoryContent: {
    loadDetail: (categoryId: number) => Promise<any>
  }
  media: {
    loadPage: LoadPage
  }
  mediaCategories: {
    loadList: LoadList
  }
  products: {
    loadPage: LoadPage
    loadDetail: (id: number) => Promise<any>
    loadSimpleList: LoadList
  }
  productCategories: {
    loadList: LoadList
  }
  tenant: {
    getEffectiveTenantId: () => string | number | null | undefined
  }
}

const emptyList = async () => []
const emptyPage = async () => ({ list: [], total: 0, pageNo: 1, pageSize: 1 })
const emptyDetail = async () => null

const createFallbackDynamicDataProvider = (): WebBuilderDynamicDataProvider => ({
  pages: {
    loadList: emptyPage,
    loadDraft: emptyDetail,
    loadHistoryDetail: emptyDetail,
  },
  posts: {
    loadPage: emptyPage,
    loadDetail: emptyDetail,
  },
  postCategories: {
    loadList: emptyList,
  },
  faqCategories: {
    loadList: emptyList,
  },
  faqItems: {
    loadList: emptyList,
  },
  productCategoryContent: {
    loadDetail: emptyDetail,
  },
  media: {
    loadPage: emptyPage,
  },
  mediaCategories: {
    loadList: emptyList,
  },
  products: {
    loadPage: emptyPage,
    loadDetail: emptyDetail,
    loadSimpleList: emptyList,
  },
  productCategories: {
    loadList: emptyList,
  },
  tenant: {
    getEffectiveTenantId: () => undefined,
  },
})

let dynamicDataProvider = createFallbackDynamicDataProvider()

export const getWebBuilderDynamicDataProvider = () => dynamicDataProvider

export const setWebBuilderDynamicDataProvider = (
  provider: WebBuilderDynamicDataProvider,
): (() => void) => {
  const previousProvider = dynamicDataProvider
  dynamicDataProvider = provider

  return () => {
    dynamicDataProvider = previousProvider
  }
}
