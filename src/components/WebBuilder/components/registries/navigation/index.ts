import { registerFooterComponent } from './footer'
import { registerFooterMenuComponent } from './footerMenu'
import { registerLanguageSwitcherComponent } from './languageSwitcher'
import { registerLogoComponent } from './logo'
import { registerNavbarComponent } from './navbar'
import { registerNavbarThbComponent } from './navbarThb'
import { registerSocialLinksComponent } from './socialLinks'
import type { ComponentRegistryExecutor } from '../types'

export const NAVIGATION_REGISTRIES: ComponentRegistryExecutor[] = [
  { id: 'navbar', register: registerNavbarComponent },
  { id: 'navbarThb', register: registerNavbarThbComponent },
  { id: 'logo', register: registerLogoComponent },
  { id: 'languageSwitcher', register: registerLanguageSwitcherComponent },
  { id: 'socialLinks', register: registerSocialLinksComponent },
  { id: 'footer', register: registerFooterComponent },
  { id: 'footerMenu', register: registerFooterMenuComponent },
]
