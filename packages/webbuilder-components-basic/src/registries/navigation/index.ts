import { registerFooterComponent } from './footer/index.js'
import { registerLanguageSwitcherComponent } from './languageSwitcher/index.js'
import { registerLogoComponent } from './logo/index.js'
import { registerNavbarComponent } from './navbar/index.js'
import { registerSocialLinksComponent } from './socialLinks/index.js'
import type { ComponentRegistryExecutor } from '../types.js'

export const BASIC_NAVIGATION_REGISTRIES: ComponentRegistryExecutor[] = [
  { id: 'navbar', register: registerNavbarComponent },
  { id: 'logo', register: registerLogoComponent },
  { id: 'languageSwitcher', register: registerLanguageSwitcherComponent },
  { id: 'socialLinks', register: registerSocialLinksComponent },
  { id: 'footer', register: registerFooterComponent },
]
