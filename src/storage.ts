import type { AppData, DayTag, Planner, Tag } from './types'
import { MAX_TAGS_PER_DAY, SUBTITLE_MAX_LENGTH } from './types'
import { DEFAULT_TAG_TYPES } from './defaults'

const STORAGE_KEY = 'annual-planner:v1'

/** Read all app data from localStorage. Returns null when absent or corrupted. */
export function loadData(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isAppData(parsed)) return null
    return normalizeData(parsed)
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
 * Legacy exports (string day ids, no tagTypes) are accepted and normalized.
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
  return normalizeData(parsed).planners
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

/**
 * Shape check only: accepts both the current format and the legacy one
 * (days as plain tag-id arrays, missing tagTypes). `normalizeData`
 * upgrades the legacy shape right after this passes.
 */
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
    (planner.tagTypes === undefined ||
      (Array.isArray(planner.tagTypes) && planner.tagTypes.every(isTagType))) &&
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
    // Types are user-managed: any non-empty id string is valid here.
    typeof tag.category === 'string' &&
    tag.category.length > 0 &&
    typeof tag.color === 'string'
  )
}

function isTagType(value: unknown): boolean {
  if (typeof value !== 'object' || value === null) return false
  const type = value as { id?: unknown; label?: unknown }
  return (
    typeof type.id === 'string' &&
    type.id.length > 0 &&
    typeof type.label === 'string' &&
    type.label.length > 0
  )
}

function isValidDays(days: Record<string, unknown>): boolean {
  return Object.entries(days).every(
    ([date, entries]) =>
      /^\d{4}-\d{2}-\d{2}$/.test(date) &&
      Array.isArray(entries) &&
      entries.length <= MAX_TAGS_PER_DAY &&
      entries.every(isValidDayTag),
  )
}

/** A day entry: legacy plain tag id, or the current { tagId, subtitle } shape. */
function isValidDayTag(value: unknown): boolean {
  if (typeof value === 'string') return value.length > 0
  if (typeof value !== 'object' || value === null) return false
  const entry = value as { tagId?: unknown; subtitle?: unknown }
  return (
    typeof entry.tagId === 'string' &&
    entry.tagId.length > 0 &&
    // Any string is accepted; normalizePlanner trims/shortens it.
    (entry.subtitle === undefined || typeof entry.subtitle === 'string')
  )
}

/* ------------------------------------------------------------------ */
/* Normalization (legacy -> current shape)                             */
/* ------------------------------------------------------------------ */

function normalizeData(data: AppData): AppData {
  return { ...data, planners: data.planners.map(normalizePlanner) }
}

function normalizePlanner(planner: Planner): Planner {
  const tagTypes =
    Array.isArray(planner.tagTypes) && planner.tagTypes.length > 0
      ? planner.tagTypes.map((t) => ({ id: t.id, label: t.label }))
      : DEFAULT_TAG_TYPES.map((t) => ({ ...t }))

  const days: Record<string, DayTag[]> = {}
  for (const [date, entries] of Object.entries(planner.days ?? {})) {
    days[date] = entries.map(normalizeDayTag)
  }

  return { ...planner, tagTypes, days }
}

function normalizeDayTag(entry: DayTag | string): DayTag {
  if (typeof entry === 'string') return { tagId: entry }
  const subtitle =
    typeof entry.subtitle === 'string'
      ? entry.subtitle.trim().slice(0, SUBTITLE_MAX_LENGTH)
      : ''
  return subtitle ? { tagId: entry.tagId, subtitle } : { tagId: entry.tagId }
}
