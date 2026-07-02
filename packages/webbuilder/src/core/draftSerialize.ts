import type { PageResourceIdentity } from './featurePlugin.js'
import { collectProjectDataComponentTypes } from './projectDataDependencies.js'

export interface DraftProjectSerialization {
  projectData: Record<string, unknown>
  schemaJson: string
  usedComponentTypes: Set<string>
}

export interface ParsedDraftProjectData {
  projectData: Record<string, unknown> | null
  error: Error | null
}

export interface BuildDraftSaveRequestOptions {
  resource: PageResourceIdentity
  resourceName?: string
  schemaJson: string
  baseUpdateTime?: Date | string
  sessionKey: string
  forceOverride?: boolean
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

export const serializeDraftProjectData = (editor: unknown): DraftProjectSerialization => {
  const getProjectData = isRecord(editor) ? editor.getProjectData : undefined
  if (typeof getProjectData !== 'function') {
    throw new Error('Editor project data is unavailable')
  }

  const rawProjectData = getProjectData.call(editor)
  const projectData = isRecord(rawProjectData) ? rawProjectData : {}

  return {
    projectData,
    schemaJson: JSON.stringify(projectData),
    usedComponentTypes: collectProjectDataComponentTypes(projectData),
  }
}

export const parseDraftProjectData = (schemaJson?: string | null): ParsedDraftProjectData => {
  const normalized = `${schemaJson ?? ''}`.trim()
  if (!normalized) {
    return { projectData: null, error: null }
  }

  try {
    const parsed = JSON.parse(normalized)
    return {
      projectData: isRecord(parsed) ? parsed : null,
      error: null,
    }
  } catch (error) {
    return {
      projectData: null,
      error: error instanceof Error ? error : new Error(String(error)),
    }
  }
}

export const buildDraftSaveRequest = (options: BuildDraftSaveRequestOptions) => ({
  ...options.resource,
  resourceName: options.resourceName,
  schemaJson: options.schemaJson,
  baseUpdateTime: options.baseUpdateTime,
  sessionKey: options.sessionKey,
  forceOverride: options.forceOverride ?? false,
})

export const getDraftUpdateTime = (record: unknown): Date | string | undefined => {
  if (!isRecord(record)) return undefined
  const updateTime = record.updateTime ?? record.updatedAt
  if (typeof updateTime === 'string' || updateTime instanceof Date) return updateTime
  return undefined
}
