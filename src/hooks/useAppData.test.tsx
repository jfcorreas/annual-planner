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
    expect(JSON.parse(stored!).planners[0].days['2026-01-01']).toEqual(['guardia-24h'])
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
    expect(result.current.activePlanner?.days['2026-01-01']).toEqual(['guardia-24h'])
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
    expect(result.current.activePlanner?.days['2026-01-01']).toEqual(['guardia-24h', 'diurno-12h'])
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

describe('removeDayTag / clearDay', () => {
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
    expect(result.current.activePlanner?.days['2026-01-01']).toEqual(['diurno-12h'])
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
      result.current.addTag(result.current.activePlanner!.id, 'Prueba', 'trabajo', '#0891b2')
    })
    expect(result.current.activePlanner?.tags).toHaveLength(9)
    expect(result.current.activePlanner?.tags.at(-1)?.label).toBe('Prueba')
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
    expect(result.current.activePlanner?.days['2026-01-02']).toEqual(['diurno-12h'])
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
