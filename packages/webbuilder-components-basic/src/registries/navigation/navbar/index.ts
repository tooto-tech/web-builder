import type { Editor } from 'grapesjs'
import { TYPE_NAVBAR } from './constants.js'
import { registerNavbarMegaTypes } from './registerMegaTypes.js'
import { registerNavbarMenuTypes } from './registerMenuTypes.js'
import { registerNavbarRootTypes } from './registerRootTypes.js'

export function registerNavbar(editor: Editor): void {
  registerNavbarMenuTypes(editor)
  registerNavbarMegaTypes(editor)
  registerNavbarRootTypes(editor)
}

export const WB_NAVBAR_TYPE = TYPE_NAVBAR

export function registerNavbarComponent(editor: Editor): void {
  registerNavbar(editor)
}
