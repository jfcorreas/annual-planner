import { describe, expect, it } from 'vitest'
import { DEFAULT_TAGS, createPlanner, newId } from './defaults'

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/** Runs `fn` with `crypto.randomUUID` missing, like a non-secure origin. */
function withoutRandomUUID<T>(fn: () => T): T {
  const original = Object.getOwnPropertyDescriptor(globalThis.crypto, 'randomUUID')
  Object.defineProperty(globalThis.crypto, 'randomUUID', {
    configurable: true,
    value: undefined,
  })
  try {
    return fn()
  } finally {
    if (original) Object.defineProperty(globalThis.crypto, 'randomUUID', original)
  }
}

describe('newId', () => {
  it('returns a v4-shaped uuid', () => {
    expect(newId()).toMatch(UUID_V4)
  })

  it('still generates unique ids when crypto.randomUUID is unavailable', () => {
    const ids = withoutRandomUUID(() => [newId(), newId(), newId()])
    for (const id of ids) expect(id).toMatch(UUID_V4)
    expect(new Set(ids).size).toBe(3)
  })

  it('creates planners without crypto.randomUUID (plain http on a LAN IP)', () => {
    const planner = withoutRandomUUID(() => createPlanner(2026))
    expect(planner.id).toMatch(UUID_V4)
    expect(planner.tags).toHaveLength(DEFAULT_TAGS.length)
  })
})

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

  it('the three Festivo default tags ship as holidays with statistics off', () => {
    for (const label of ['Festivo local', 'Festivo regional', 'Festivo nacional']) {
      const tag = DEFAULT_TAGS.find((t) => t.label === label)
      expect(tag).toBeDefined()
      expect(tag!.holiday).toBe(true)
      expect(tag!.inStats).toBe(false)
    }

    // The remaining five defaults are regular and counted.
    const regular = DEFAULT_TAGS.filter((t) => t.holiday !== true)
    expect(regular).toHaveLength(5)
    for (const tag of regular) {
      expect(tag.inStats).not.toBe(false)
    }
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
  })

  it('copies the tags so planners do not share them', () => {
    const a = createPlanner(2026)
    const b = createPlanner(2027)
    expect(a.tags).toHaveLength(DEFAULT_TAGS.length)
    a.tags.pop()
    expect(b.tags).toHaveLength(DEFAULT_TAGS.length)
    expect(DEFAULT_TAGS).toHaveLength(8)
  })
})
