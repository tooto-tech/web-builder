import { registerCarouselComponent } from './carousel'
import { registerFlipbookComponent } from './flipbook'
import { registerIconComponent } from './icon'
import { registerImageComponent } from './image'
import { registerIndustryTabsComponent } from './industryTabs'
import { registerMarqueeComponent } from './marquee'
import { registerOurSolutionsComponent } from './ourSolutions'
import { registerPdfViewerComponent } from './pdfViewer'
import { registerProductCategoriesComponent } from './productCategories'
import { registerTabMediaGalleryComponent } from './tabMediaGallery'
import { registerVideoComponent } from './video'
import type { ComponentRegistryExecutor } from '../types'

export const MEDIA_REGISTRIES: ComponentRegistryExecutor[] = [
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
