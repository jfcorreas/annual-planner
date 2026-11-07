export interface Tag {
  id: string
  label: string
  /** Hex color, e.g. "#facc15" */
  color: string
  /** Counted in the statistics bars. Missing (old data) means included. */
  inStats?: boolean
  /** Holiday flag: shows 🏖️ and forces the tag out of the statistics. */
  holiday?: boolean
  /** Work permit: shows 🪪, has its own stats group and a yearly max. */
  permit?: boolean
  /** Max applications per year for a work permit (whole number ≥ 1). */
  maxPerYear?: number
  /** Global tag: same-id copies in every planner, kept in sync. Missing = local. */
  global?: boolean
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
  version: 2
  planners: Planner[]
}

export const MAX_TAGS_PER_DAY = 2

/** Maximum length of a day-application subtitle. */
export const SUBTITLE_MAX_LENGTH = 60
