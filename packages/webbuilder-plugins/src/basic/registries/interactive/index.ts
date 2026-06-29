import { registerAccordionComponent } from './accordion/index.js'
import { registerBackButtonComponent } from './backButton/index.js'
import { registerButtonComponent } from './button/index.js'
import { registerCountUpComponent } from './countUp/index.js'
import { registerCustomCodeComponent } from './customCode/index.js'
import { registerPopupComponent } from './popup/index.js'
import { registerSalesmartlyChatButtonComponent } from './salesmartlyChatButton/index.js'
import { registerSearchComponent } from './search/index.js'
import { registerSocialShareComponent } from './socialShare/index.js'
import { registerTabsComponent } from './tabs/index.js'
import type { ComponentRegistryExecutor } from '../types.js'

export const BASIC_INTERACTIVE_REGISTRIES: ComponentRegistryExecutor[] = [
  { id: 'button', register: registerButtonComponent },
  { id: 'popup', register: registerPopupComponent },
  { id: 'accordion', register: registerAccordionComponent },
  { id: 'tabs', register: registerTabsComponent },
  { id: 'countUp', register: registerCountUpComponent },
  { id: 'search', register: registerSearchComponent },
  { id: 'backButton', register: registerBackButtonComponent },
  { id: 'socialShare', register: registerSocialShareComponent },
  { id: 'customCode', register: registerCustomCodeComponent },
  { id: 'salesmartlyChatButton', register: registerSalesmartlyChatButtonComponent },
]
