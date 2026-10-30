export interface Tag {
  id: string
  label: string
  /** Hex color, e.g. "#facc15" */
  color: string
}

/**
 * One tag applied on a day. The subtitle belongs to this application
 * (each day can carry its own text for the same tag).
 */
export interface DayTag {
  tagId: string
  /** Optional short text shown in the day chip and the detail modal. */
  subtitle?: string
}

export type PlannerStatus = 'activo' | 'archivado'

export interface Planner {
  id: string
  year: number
  name: string
  status: PlannerStatus
  tags: Tag[]
  /** ISO date (yyyy-MM-dd) -> up to MAX_TAGS_PER_DAY applied tags */
  days: Record<string, DayTag[]>
}

export interface AppData {
  version: 1
  planners: Planner[]
}

export const MAX_TAGS_PER_DAY = 2

/** Maximum length of a day-application subtitle. */
export const SUBTITLE_MAX_LENGTH = 60
