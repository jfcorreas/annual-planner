import type { AppData, Planner, Tag } from './types'
import { MAX_TAGS_PER_DAY } from './types'

const STORAGE_KEY = 'annual-planner:v1'

/** Read all app data from localStorage. Returns null when absent or corrupted. */
export function loadData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isAppData(parsed)) return null
    return parsed
  } catch {
    return null
  }
}

/** Persist all app data. Silently ignores quota errors (data stays in memory). */
export function saveData(data: AppData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable: nothing else we can do client-side.
  }
}

/* ------------------------------------------------------------------ */
/* Export / import                                                     */
/* ------------------------------------------------------------------ */

/** Serialize planners to a pretty JSON string (file to download). */
export function exportToJson(planners: Planner[]): string {
  const data: AppData = { version: 1, planners }
  return JSON.stringify(data, null, 2)
}

/**
 * Parse and validate an imported JSON string.
 * Throws an Error with a user-facing (ES/ES) message when invalid.
 */
export function importFromJson(json: string): Planner[] {
  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new Error('El archivo no es un JSON válido.')
  }
  if (!isAppData(parsed)) {
    throw new Error('El archivo no tiene el formato de un export del planificador.')
  }
  return parsed.planners
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

function isAppData(value: unknown): value is AppData {
  if (typeof value !== 'object' || value === null) return false
  const data = value as Partial<AppData>
  return data.version === 1 && Array.isArray(data.planners) && data.planners.every(isPlanner)
}

function isPlanner(value: unknown): value is Planner {
  if (typeof value !== 'object' || value === null) return false
  const planner = value as Partial<Planner>
  return (
    typeof planner.id === 'string' &&
    typeof planner.year === 'number' &&
    Number.isInteger(planner.year) &&
    planner.year >= 1900 &&
    planner.year <= 2200 &&
    typeof planner.name === 'string' &&
    (planner.status === 'activo' || planner.status === 'archivado') &&
    Array.isArray(planner.tags) &&
    planner.tags.every(isTag) &&
    typeof planner.days === 'object' &&
    planner.days !== null &&
    isValidDays(planner.days)
  )
}

function isTag(value: unknown): value is Tag {
  if (typeof value !== 'object' || value === null) return false
  const tag = value as Partial<Tag>
  return (
    typeof tag.id === 'string' &&
    typeof tag.label === 'string' &&
    (tag.category === 'trabajo' ||
      tag.category === 'local' ||
      tag.category === 'regional' ||
      tag.category === 'nacional') &&
    typeof tag.color === 'string'
  )
}

function isValidDays(days: Record<string, unknown>): boolean {
  return Object.entries(days).every(
    ([date, ids]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      Array.isArray(ids) &&
      ids.length <= MAX_TAGS_PER_DAY &&
      ids.every((id) => typeof id === 'string'),
  )
}
