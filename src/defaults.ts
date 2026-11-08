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

/**
 * Id generator. `crypto.randomUUID` only exists in secure contexts, so it is
 * unavailable when the built app is opened over plain http on a LAN IP
 * (e.g. a phone at http://192.168.x.x:port) and the first render would crash.
 * Ids only need to be unique per device, so a random v4-shaped string is enough.
 */
export function newId(): string {
  const randomUUID = globalThis.crypto?.randomUUID
  if (typeof randomUUID === 'function') return randomUUID.call(globalThis.crypto)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

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
    id: newId(),
    year,
    name: `Planificador ${year}`,
    status: 'activo',
    tags,
    days: {},
  }
}
