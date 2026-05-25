import type { Editor } from 'grapesjs'
import { TYPE_NAVBAR } from './constants'
import { registerNavbarMegaTypes } from './registerMegaTypes'
import { registerNavbarMenuTypes } from './registerMenuTypes'
import { registerNavbarRootTypes } from './registerRootTypes'

export function registerNavbar(editor: Editor): void {
  registerNavbarMenuTypes(editor)
  registerNavbarMegaTypes(editor)
  registerNavbarRootTypes(editor)
}

export const WB_NAVBAR_TYPE = TYPE_NAVBAR

export function registerNavbarComponent(editor: Editor): void {
  registerNavbar(editor)
}
