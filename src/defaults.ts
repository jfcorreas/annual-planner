import type { Planner, Tag } from './types'

/** Default tags of a new planner (labels in ES/ES, colors approved in the sketch). */
export const DEFAULT_TAGS: Tag[] = [
  { id: 'guardia-24h', label: 'Guardia 24h', color: '#facc15' },
  { id: 'guardia-17h', label: 'Guardia 17h', color: '#a16207' },
  { id: 'diurno-12h', label: 'Diurno 12h', color: '#2f6fed' },
  { id: 'nocturno-12h', label: 'Nocturno 12h', color: '#7c5ce0' },
  { id: 'turno-24h', label: 'Turno 24h', color: '#e01b24' },
  { id: 'festivo-local', label: 'Festivo local', color: '#86efac', holiday: true, inStats: false },
  { id: 'festivo-regional', label: 'Festivo regional', color: '#3fae6b', holiday: true, inStats: false },
  { id: 'festivo-nacional', label: 'Festivo nacional', color: '#15803d', holiday: true, inStats: false },
]

export function createPlanner(year: number, extraTags: Tag[] = []): Planner {
  // Extra tags (globals) are added by id: they win over a colliding default
  // and are appended when new, so no id ever appears twice.
  const tags = DEFAULT_TAGS.map((tag) => ({ ...tag }))
  for (const extra of extraTags) {
    const index = tags.findIndex((tag) => tag.id === extra.id)
    if (index >= 0) tags[index] = { ...extra }
    else tags.push({ ...extra })
  }
  return {
    id: crypto.randomUUID(),
    year,
    name: `Planificador ${year}`,
    status: 'activo',
    tags,
    days: {},
  }
}
