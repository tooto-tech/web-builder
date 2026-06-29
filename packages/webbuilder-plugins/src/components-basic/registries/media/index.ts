import { registerCarouselComponent } from './carousel/index.js'
import { registerFlipbookComponent } from './flipbook/index.js'
import { registerIconComponent } from './icon/index.js'
import { registerImageComponent } from './image/index.js'
import { registerIndustryTabsComponent } from './industryTabs/index.js'
import { registerMarqueeComponent } from './marquee/index.js'
import { registerOurSolutionsComponent } from './ourSolutions/index.js'
import { registerPdfViewerComponent } from './pdfViewer/index.js'
import { registerProductCategoriesComponent } from './productCategories/index.js'
import { registerTabMediaGalleryComponent } from './tabMediaGallery/index.js'
import { registerVideoComponent } from './video/index.js'
import type { ComponentRegistryExecutor } from '../types.js'

export const BASIC_MEDIA_REGISTRIES: ComponentRegistryExecutor[] = [
  { id: 'carousel', register: registerCarouselComponent },
  { id: 'image', register: registerImageComponent },
  { id: 'icon', register: registerIconComponent },
  { id: 'marquee', register: registerMarqueeComponent },
  { id: 'industryTabs', register: registerIndustryTabsComponent },
  { id: 'productCategories', register: registerProductCategoriesComponent },
  { id: 'ourSolutions', register: registerOurSolutionsComponent },
  { id: 'flipbook', register: registerFlipbookComponent },
  { id: 'video', register: registerVideoComponent },
  { id: 'pdfViewer', register: registerPdfViewerComponent },
  { id: 'tabMediaGallery', register: registerTabMediaGalleryComponent },
]
