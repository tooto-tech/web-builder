import { registerAccordionComponent } from './accordion'
import { registerBackButtonComponent } from './backButton'
import { registerButtonComponent } from './button'
import { registerCountUpComponent } from './countUp'
import { registerCustomCodeComponent } from './customCode'
import { registerInquiryFormComponent } from './inquiryForm'
import { registerKlaviyoSubscribeComponent } from './klaviyoSubscribe'
import { registerSalesmartlyChatButtonComponent } from './salesmartlyChatButton'
import { registerSearchComponent } from './search'
import { registerSocialShareComponent } from './socialShare'
import { registerTabsComponent } from './tabs'
import type { ComponentRegistryExecutor } from '../types'

export const INTERACTIVE_REGISTRIES: ComponentRegistryExecutor[] = [
  { id: 'button', register: registerButtonComponent },
  { id: 'accordion', register: registerAccordionComponent },
  { id: 'tabs', register: registerTabsComponent },
  { id: 'countUp', register: registerCountUpComponent },
  { id: 'search', register: registerSearchComponent },
  { id: 'backButton', register: registerBackButtonComponent },
  { id: 'socialShare', register: registerSocialShareComponent },
  { id: 'customCode', register: registerCustomCodeComponent },
  { id: 'klaviyoSubscribe', register: registerKlaviyoSubscribeComponent },
  { id: 'salesmartlyChatButton', register: registerSalesmartlyChatButtonComponent },
  { id: 'inquiryForm', register: registerInquiryFormComponent },
]
