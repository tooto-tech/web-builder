import type { GlobalSettingsSnapshot } from '@toototech/webbuilder/core'
import {
  buildGlobalSettingsCss,
  getEnabledGlobalCustomCode,
  getGlobalSettingsGoogleFontName,
} from './runtime/canvasInjection.js'

export interface GlobalSettingsPublishedAssets {
  css: string
  headHtml: string
  bodyStartHtml: string
  bodyEndHtml: string
  metadata: {
    globalSettings: {
      version?: string
      hash?: string
      updatedAt?: string
    }
  }
}

const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const buildGoogleFontLinkHtml = (googleName: string) => {
  if (!googleName) return ''
  const escapedName = escapeHtmlAttribute(googleName)
  const href = `https://fonts.googleapis.com/css2?family=${escapedName}:wght@300;400;500;600;700&display=swap`
  return `<link rel="stylesheet" data-wb-gf="${escapedName}" href="${href}">`
}

const joinHtml = (fragments: string[]) =>
  fragments
    .map(fragment => fragment.trim())
    .filter(Boolean)
    .join('\n')

export const renderGlobalSettingsPublishedAssets = (
  snapshot: GlobalSettingsSnapshot
): GlobalSettingsPublishedAssets => {
  const googleName = getGlobalSettingsGoogleFontName(snapshot)

  return {
    css: buildGlobalSettingsCss(snapshot),
    headHtml: joinHtml([
      buildGoogleFontLinkHtml(googleName),
      getEnabledGlobalCustomCode(snapshot, 'head'),
    ]),
    bodyStartHtml: getEnabledGlobalCustomCode(snapshot, 'body-start'),
    bodyEndHtml: getEnabledGlobalCustomCode(snapshot, 'body-end'),
    metadata: {
      globalSettings: {
        version: snapshot.version,
        hash: snapshot.hash,
        updatedAt: snapshot.updatedAt,
      },
    },
  }
}
