import { describe, expect, it } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import { useAppData } from './useAppData'
import { createPlanner } from '../defaults'
import type { AppData } from '../types'

const STORAGE_KEY = 'annual-planner:v1'

function setup() {
  return renderHook(() => useAppData())
}

describe('initial state', () => {
  it('starts with one active planner for the current year', () => {
    const { result } = setup()
    expect(result.current.planners).toHaveLength(1)
    expect(result.current.activePlanner?.year).toBe(new Date().getFullYear())
    expect(result.current.activePlanner?.status).toBe('activo')
  })

  it('loads persisted planners instead of creating one', () => {
    const persisted: AppData = { version: 1, planners: [createPlanner(2030)] }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted))

    const { result } = setup()
    expect(result.current.planners).toHaveLength(1)
    expect(result.current.activePlanner?.year).toBe(2030)
  })

  it('persists mutations to localStorage', () => {
    const { result } = setup()
    act(() => {
      result.current.toggleDayTag(result.current.activePlanner!.id, '2026-01-01', 'guardia-24h')
    })
    const stored = localStorage.getItem(STORAGE_KEY)
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored!).planners[0].days['2026-01-01']).toEqual([
      { tagId: 'guardia-24h' },
    ])
  })
})

describe('toggleDayTag', () => {
  it('adds a tag and returns true (reliable return value)', () => {
    const { result } = setup()
    const id = result.current.activePlanner!.id

    let applied = false
    act(() => {
      applied = result.current.toggleDayTag(id, '2026-01-01', 'guardia-24h')
    })
    expect(applied).toBe(true)
    expect(result.current.activePlanner?.days['2026-01-01']).toEqual([{ tagId: 'guardia-24h' }])
  })

  it('allows up to 2 tags and rejects the 3rd without changing state', () => {
    const { result } = setup()
    const id = result.current.activePlanner!.id

    act(() => {
      result.current.toggleDayTag(id, '2026-01-01', 'guardia-24h')
    })
    act(() => {
      result.current.toggleDayTag(id, '2026-01-01', 'diurno-12h')
    })

    let third = true
    act(() => {
      third = result.current.toggleDayTag(id, '2026-01-01', 'turno-24h')
    })
    expect(third).toBe(false)
    expect(result.current.activePlanner?.days['2026-01-01']).toEqual([
      { tagId: 'guardia-24h' },
      { tagId: 'diurno-12h' },
    ])
  })

  it('removes the tag when toggled again', () => {
    const { result } = setup()
    const id = result.current.activePlanner!.id

    act(() => {
      result.current.toggleDayTag(id, '2026-01-01', 'guardia-24h')
    })
    act(() => {
      result.current.toggleDayTag(id, '2026-01-01', 'guardia-24h')
    })
    expect(result.current.activePlanner?.days['2026-01-01']).toEqual([])
  })

  it('returns false for an unknown planner', () => {
    const { result } = setup()
    let applied = true
    act(() => {
      applied = result.current.toggleDayTag('nope', '2026-01-01', 'guardia-24h')
    })
    expect(applied).toBe(false)
  })
})

describe('removeDayTag / clearDay / setDayTagSubtitle', () => {
  it('removes one tag from a day', () => {
    const { result } = setup()
    const id = result.current.activePlanner!.id
    act(() => {
      result.current.toggleDayTag(id, '2026-01-01', 'guardia-24h')
      result.current.toggleDayTag(id, '2026-01-01', 'diurno-12h')
    })
    act(() => {
      result.current.removeDayTag(id, '2026-01-01', 'guardia-24h')
    })
    expect(result.current.activePlanner?.days['2026-01-01']).toEqual([
      { tagId: 'diurno-12h' },
    ])
  })

  it('clears every tag of a day', () => {
    const { result } = setup()
    const id = result.current.activePlanner!.id
    act(() => {
      result.current.toggleDayTag(id, '2026-01-01', 'guardia-24h')
      result.current.toggleDayTag(id, '2026-01-01', 'diurno-12h')
    })
    act(() => {
      result.current.clearDay(id, '2026-01-01')
    })
    expect(result.current.activePlanner?.days['2026-01-01']).toBeUndefined()
  })

  it('sets, updates and clears the subtitle of one application', () => {
    const { result } = setup()
    const id = result.current.activePlanner!.id
    act(() => {
      result.current.toggleDayTag(id, '2026-01-01', 'guardia-24h')
    })
    act(() => {
      result.current.toggleDayTag(id, '2026-01-01', 'diurno-12h')
    })

    act(() => {
      result.current.setDayTagSubtitle(id, '2026-01-01', 'guardia-24h', '  de tarde  ')
    })
    expect(result.current.activePlanner?.days['2026-01-01']).toEqual([
      { tagId: 'guardia-24h', subtitle: 'de tarde' },
      { tagId: 'diurno-12h' },
    ])

    act(() => {
      result.current.setDayTagSubtitle(id, '2026-01-01', 'guardia-24h', '')
    })
    expect(result.current.activePlanner?.days['2026-01-01'][0]).toEqual({
      tagId: 'guardia-24h',
    })
  })

  it('keeps other days untouched when editing a subtitle', () => {
    const { result } = setup()
    const id = result.current.activePlanner!.id
    act(() => {
      result.current.toggleDayTag(id, '2026-01-01', 'guardia-24h')
    })
    act(() => {
      result.current.toggleDayTag(id, '2026-01-02', 'guardia-24h')
    })
    act(() => {
      result.current.setDayTagSubtitle(id, '2026-01-01', 'guardia-24h', 'uno')
    })
    expect(result.current.activePlanner?.days['2026-01-02']).toEqual([{ tagId: 'guardia-24h' }])
    expect(result.current.activePlanner?.days['2026-01-01']).toEqual([
      { tagId: 'guardia-24h', subtitle: 'uno' },
    ])
  })
})

describe('planners', () => {
  it('creates a new planner and makes it active', () => {
    const { result } = setup()
    let created = ''
    act(() => {
      created = result.current.addPlanner(2030).id
    })
    expect(result.current.planners).toHaveLength(2)
    expect(result.current.activePlannerId).toBe(created)
    expect(result.current.activePlanner?.year).toBe(2030)
  })

  it('removes a planner and falls back to the remaining one', () => {
    const { result } = setup()
    act(() => {
      result.current.addPlanner(2030)
    })
    const firstId = result.current.planners[0].id
    act(() => {
      result.current.removePlanner(result.current.activePlannerId!)
    })
    expect(result.current.planners).toHaveLength(1)
    expect(result.current.activePlannerId).toBe(firstId)
  })

  it('toggles status between activo and archivado', () => {
    const { result } = setup()
    const id = result.current.activePlanner!.id
    act(() => {
      result.current.setPlannerStatus(id, 'archivado')
    })
    expect(result.current.activePlanner?.status).toBe('archivado')
    act(() => {
      result.current.setPlannerStatus(id, 'activo')
    })
    expect(result.current.activePlanner?.status).toBe('activo')
  })
})

describe('tags', () => {
  it('adds a tag to the active planner', () => {
    const { result } = setup()
    act(() => {
      result.current.addTag(result.current.activePlanner!.id, 'Prueba', '#0891b2')
    })
    expect(result.current.activePlanner?.tags).toHaveLength(9)
    expect(result.current.activePlanner?.tags.at(-1)?.label).toBe('Prueba')
  })

  it('addTag stores the permit flag and its yearly max; a plain tag has neither', () => {
    const { result } = setup()
    const id = result.current.activePlanner!.id
    act(() => {
      result.current.addTag(id, 'Permiso', '#0891b2', true, false, true, 10)
      result.current.addTag(id, 'Normal', '#facc15')
    })

    const permit = result.current.activePlanner?.tags.find((t) => t.label === 'Permiso')
    expect(permit?.permit).toBe(true)
    expect(permit?.maxPerYear).toBe(10)

    const plain = result.current.activePlanner?.tags.find((t) => t.label === 'Normal')
    expect(plain?.permit).toBeUndefined()
    expect(plain?.maxPerYear).toBeUndefined()
  })

  it('removes a tag everywhere in the planner', () => {
    const { result } = setup()
    const id = result.current.activePlanner!.id
    act(() => {
      result.current.toggleDayTag(id, '2026-01-01', 'guardia-24h')
      result.current.toggleDayTag(id, '2026-01-02', 'diurno-12h')
    })
    act(() => {
      result.current.removeTag(id, 'guardia-24h')
    })
    expect(result.current.activePlanner?.tags.find((t) => t.id === 'guardia-24h')).toBeUndefined()
    // The day that only had the removed tag is dropped entirely.
    expect(result.current.activePlanner?.days['2026-01-01']).toBeUndefined()
    expect(result.current.activePlanner?.days['2026-01-02']).toEqual([{ tagId: 'diurno-12h' }])
  })
})

describe('global tags', () => {
  it('updateTag with global: true writes the tag into every planner', () => {
    const { result } = setup()
    const firstId = result.current.activePlanner!.id
    let tagId = ''

    act(() => {
      tagId = result.current.addTag(firstId, 'Compartida', '#0891b2').id
    })
    act(() => {
      result.current.addPlanner(2030)
    })
    // Created before the flag, so the new planner does not carry it yet.
    expect(result.current.planners[1].tags.some((t) => t.id === tagId)).toBe(false)

    act(() => {
      result.current.updateTag(firstId, tagId, { global: true })
    })

    for (const planner of result.current.planners) {
      const tag = planner.tags.find((t) => t.id === tagId)
      expect(tag?.label).toBe('Compartida')
      expect(tag?.color).toBe('#0891b2')
      expect(tag?.global).toBe(true)
    }
  })

  it('updateTag on a global tag propagates label and color to every planner', () => {
    const { result } = setup()
    const firstId = result.current.activePlanner!.id
    let tagId = ''

    act(() => {
      tagId = result.current.addTag(firstId, 'Compartida', '#0891b2').id
    })
    act(() => {
      result.current.addPlanner(2030)
    })
    act(() => {
      result.current.updateTag(firstId, tagId, { global: true })
    })

    act(() => {
      result.current.updateTag(firstId, tagId, { label: 'Renombrada', color: '#db2777' })
    })

    for (const planner of result.current.planners) {
      const tag = planner.tags.find((t) => t.id === tagId)
      expect(tag?.label).toBe('Renombrada')
      expect(tag?.color).toBe('#db2777')
      expect(tag?.global).toBe(true)
    }
  })

  it('updateTag with global: false clears the flag in every planner, keeping the copies', () => {
    const { result } = setup()
    const firstId = result.current.activePlanner!.id
    let tagId = ''

    act(() => {
      tagId = result.current.addTag(firstId, 'Compartida', '#0891b2').id
    })
    act(() => {
      result.current.addPlanner(2030)
    })
    act(() => {
      result.current.updateTag(firstId, tagId, { global: true })
    })

    act(() => {
      result.current.updateTag(firstId, tagId, { global: false })
    })

    // D1(b): every planner keeps its copy, now as a local tag.
    expect(result.current.planners).toHaveLength(2)
    for (const planner of result.current.planners) {
      const tag = planner.tags.find((t) => t.id === tagId)
      expect(tag?.label).toBe('Compartida')
      expect(tag?.global).not.toBe(true)
    }
  })

  it('addTag with the global flag adds it to every planner', () => {
    const { result } = setup()
    const firstId = result.current.activePlanner!.id
    act(() => {
      result.current.addPlanner(2030)
    })

    let tagId = ''
    act(() => {
      tagId = result.current.addTag(
        firstId,
        'Guardia global',
        '#0891b2',
        true,
        false,
        false,
        undefined,
        true,
      ).id
    })

    // Created in the first planner, it must exist in every planner.
    expect(result.current.planners).toHaveLength(2)
    for (const planner of result.current.planners) {
      const tag = planner.tags.find((t) => t.id === tagId)
      expect(tag?.label).toBe('Guardia global')
      expect(tag?.global).toBe(true)
    }
  })

  it('removeTag of a global tag removes it from every planner', () => {
    const { result } = setup()
    const firstId = result.current.activePlanner!.id
    act(() => {
      result.current.addPlanner(2030)
    })

    let tagId = ''
    act(() => {
      tagId = result.current.addTag(
        firstId,
        'Guardia global',
        '#0891b2',
        true,
        false,
        false,
        undefined,
        true,
      ).id
    })
    act(() => {
      result.current.toggleDayTag(firstId, '2026-01-01', tagId)
    })

    act(() => {
      result.current.removeTag(firstId, tagId)
    })

    // Gone from every planner…
    for (const planner of result.current.planners) {
      expect(planner.tags.find((t) => t.id === tagId)).toBeUndefined()
    }
    // …and from the day it was applied on.
    expect(result.current.planners[0].days['2026-01-01']).toBeUndefined()
  })

  it('addPlanner starts with defaults + current globals, with no duplicate when ids collide', () => {
    const { result } = setup()
    const firstId = result.current.activePlanner!.id

    // A brand-new global tag…
    let customId = ''
    act(() => {
      customId = result.current.addTag(
        firstId,
        'Compartida',
        '#0891b2',
        true,
        false,
        false,
        undefined,
        true,
      ).id
    })
    // …and a default tag marked global and customized (same id as the pristine default).
    act(() => {
      result.current.updateTag(firstId, 'festivo-local', { global: true })
    })
    act(() => {
      result.current.updateTag(firstId, 'festivo-local', { label: 'Festivo propio' })
    })

    act(() => {
      result.current.addPlanner(2030)
    })

    const created = result.current.planners[1]
    const custom = created.tags.find((t) => t.id === customId)
    expect(custom?.label).toBe('Compartida')
    expect(custom?.global).toBe(true)

    // The colliding default appears once, with the global (synced) version.
    const locals = created.tags.filter((t) => t.id === 'festivo-local')
    expect(locals).toHaveLength(1)
    expect(locals[0].label).toBe('Festivo propio')
    expect(locals[0].global).toBe(true)

    // 8 defaults (one of them the collided global) + the new global tag.
    expect(created.tags).toHaveLength(9)
  })
})

describe('mergePlanners (import)', () => {
  it('updates by id, appends new ones and keeps the rest', () => {
    const { result } = setup()
    const current = result.current.planners[0]

    const updated = { ...current, name: 'Planificador actualizado' }
    const fresh = createPlanner(2031)
    act(() => {
      result.current.mergePlanners([updated, fresh])
    })

    expect(result.current.planners).toHaveLength(2)
    expect(result.current.activePlanner?.name).toBe('Planificador actualizado')
    expect(result.current.planners.map((p) => p.year)).toContain(2031)
  })

  it('keeps the active planner when it survives the merge', () => {
    const { result } = setup()
    const activeId = result.current.activePlannerId
    act(() => {
      result.current.mergePlanners([createPlanner(2031)])
    })
    expect(result.current.activePlannerId).toBe(activeId)
  })
})
