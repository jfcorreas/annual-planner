import { describe, expect, it } from 'vitest'
import { DEFAULT_TAGS, DEFAULT_TAG_TYPES, createPlanner } from './defaults'

describe('DEFAULT_TAGS', () => {
  it('has the approved 8 default tags in ES/ES', () => {
    expect(DEFAULT_TAGS).toHaveLength(8)
    expect(DEFAULT_TAGS.map((t) => t.label)).toEqual([
      'Guardia 24h',
      'Guardia 17h',
      'Diurno 12h',
      'Nocturno 12h',
      'Turno 24h',
      'Festivo local',
      'Festivo regional',
      'Festivo nacional',
    ])
  })
})

describe('DEFAULT_TAG_TYPES', () => {
  it('keeps the legacy ids so old data matches without migration', () => {
    expect(DEFAULT_TAG_TYPES.map((t) => t.id)).toEqual(['trabajo', 'local', 'regional', 'nacional'])
    expect(DEFAULT_TAG_TYPES.map((t) => t.label)).toEqual([
      'Trabajo',
      'Festivo local',
      'Festivo regional',
      'Festivo nacional',
    ])
  })
})

describe('createPlanner', () => {
  it('creates an active planner for the given year with no days', () => {
    const planner = createPlanner(2026)
    expect(planner.year).toBe(2026)
    expect(planner.name).toBe('Planificador 2026')
    expect(planner.status).toBe('activo')
    expect(planner.days).toEqual({})
    expect(planner.id).toBeTruthy()
    expect(planner.tagTypes).toHaveLength(4)
  })

  it('copies the tags so planners do not share them', () => {
    const a = createPlanner(2026)
    const b = createPlanner(2027)
    expect(a.tags).toHaveLength(DEFAULT_TAGS.length)
    a.tags.pop()
    expect(b.tags).toHaveLength(DEFAULT_TAGS.length)
    expect(DEFAULT_TAGS).toHaveLength(8)
  })

  it('copies the tag types so planners do not share them', () => {
    const a = createPlanner(2026)
    const b = createPlanner(2027)
    a.tagTypes.pop()
    expect(b.tagTypes).toHaveLength(DEFAULT_TAG_TYPES.length)
    expect(DEFAULT_TAG_TYPES).toHaveLength(4)
  })
})
