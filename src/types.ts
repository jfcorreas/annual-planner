/** Category of a tag: work shift or a kind of public holiday. */
export type TagCategory = 'trabajo' | 'local' | 'regional' | 'nacional'

export interface Tag {
  id: string
  label: string
  category: TagCategory
  /** Hex color, e.g. "#facc15" */
  color: string
}

export type PlannerStatus = 'activo' | 'archivado'

export interface Planner {
  id: string
  year: number
  name: string
  status: PlannerStatus
  tags: Tag[]
  /** ISO date (yyyy-MM-dd) -> up to MAX_TAGS_PER_DAY tag ids */
  days: Record<string, string[]>
}

export interface AppData {
  version: 1
  planners: Planner[]
}

export const MAX_TAGS_PER_DAY = 2

export const CATEGORY_LABELS: Record<TagCategory, string> = {
  trabajo: 'Trabajo',
  local: 'Festivo local',
  regional: 'Festivo regional',
  nacional: 'Festivo nacional',
}
