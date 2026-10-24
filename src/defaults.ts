import type { Planner, Tag } from './types'

/** Default tags of a new planner (labels in ES/ES, colors approved in the sketch). */
export const DEFAULT_TAGS: Tag[] = [
  { id: 'guardia-24h', label: 'Guardia 24h', category: 'trabajo', color: '#facc15' },
  { id: 'guardia-17h', label: 'Guardia 17h', category: 'trabajo', color: '#a16207' },
  { id: 'diurno-12h', label: 'Diurno 12h', category: 'trabajo', color: '#2f6fed' },
  { id: 'nocturno-12h', label: 'Nocturno 12h', category: 'trabajo', color: '#7c5ce0' },
  { id: 'turno-24h', label: 'Turno 24h', category: 'trabajo', color: '#e01b24' },
  { id: 'festivo-local', label: 'Festivo local', category: 'local', color: '#86efac' },
  { id: 'festivo-regional', label: 'Festivo regional', category: 'regional', color: '#3fae6b' },
  { id: 'festivo-nacional', label: 'Festivo nacional', category: 'nacional', color: '#15803d' },
]

export function createPlanner(year: number): Planner {
  return {
    id: crypto.randomUUID(),
    year,
    name: `Planificador ${year}`,
    status: 'activo',
    tags: DEFAULT_TAGS.map((tag) => ({ ...tag })),
    days: {},
  }
}
