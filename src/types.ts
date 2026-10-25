/** User-managed category of tags. Default ids keep the legacy literal values. */
export interface TagType {
  id: string
  label: string
}

export interface Tag {
  id: string
  label: string
  /** Id of the TagType that classifies this tag. */
  category: string
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
  /** Types usable in the "Tipo" select (CRUD managed by the user). */
  tagTypes: TagType[]
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

/** Label shown when a tag points to a type id that no longer exists. */
export const NO_TYPE_LABEL = 'Sin tipo'

/** Display label of a tag type id, with a safe fallback. */
export function tagTypeLabel(tagTypes: TagType[], id: string): string {
  return tagTypes.find((t) => t.id === id)?.label ?? NO_TYPE_LABEL
}
