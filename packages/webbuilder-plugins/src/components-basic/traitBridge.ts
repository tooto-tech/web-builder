/**
 * Module-level bridge for cross-framework communication between
 * GrapesJS custom trait types (pure DOM) and the Vue panel.
 *
 * GrapesJS custom trait types run in plain DOM context, but some UI
 * (like WbColorPicker or imageManager) lives in the Vue layer.
 * This module provides a simple callback bridge.
 */

// ── Color Picker ──────────────────────────────────────────────

export interface ColorPickerOpenParams {
  anchor: HTMLElement
  value: string
  onChange: (v: string) => void
  onClear: () => void
}

type ColorPickerHandler = (params: ColorPickerOpenParams) => void

let _openColorPicker: ColorPickerHandler | null = null

export function setColorPickerHandler(fn: ColorPickerHandler) {
  _openColorPicker = fn
}

export function openColorPicker(params: ColorPickerOpenParams) {
  _openColorPicker?.(params)
}

// ── Image Manager ─────────────────────────────────────────────

let _imageManager: any = null

export function setImageManager(im: any) {
  _imageManager = im
}

export function getImageManager(): any {
  return _imageManager
}
