import { describe, expect, it } from 'vitest'
import type { AppData } from './types'
import { exportToJson, importFromJson, loadData, saveData } from './storage'
import { createPlanner } from './defaults'

const STORAGE_KEY = 'annual-planner:v1'

function sampleData(): AppData {
  return { version: 1, planners: [createPlanner(2026)] }
}

describe('loadData / saveData', () => {
  it('round-trips data through localStorage', () => {
    const data = sampleData()
    saveData(data)
    expect(loadData()).toEqual(data)
  })

  it('returns null when nothing is stored', () => {
    expect(loadData()).toBeNull()
  })

  it('returns null for corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{no es json')
    expect(loadData()).toBeNull()
  })

  it('returns null for a wrong schema (other version)', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, planners: [] }))
    expect(loadData()).toBeNull()
  })

  it('returns null when a day holds more tags than allowed', () => {
    const data = sampleData()
    data.planners[0].days['2026-01-01'] = [{ tagId: 'a' }, { tagId: 'b' }, { tagId: 'c' }]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    expect(loadData()).toBeNull()
  })

  it('round-trips day subtitles through localStorage', () => {
    const data = sampleData()
    data.planners[0].days['2026-01-01'] = [{ tagId: 'guardia-24h', subtitle: 'de tarde' }]
    saveData(data)
    expect(loadData()?.planners[0].days['2026-01-01']).toEqual([
      { tagId: 'guardia-24h', subtitle: 'de tarde' },
    ])
  })

  it('normalizes legacy data (string day ids, no tagTypes) on load', () => {
    const legacy = {
      version: 1,
      planners: [
        {
          id: 'p1',
          year: 2026,
          name: 'Planificador 2026',
          status: 'activo',
          tags: [{ id: 'a', label: 'A', category: 'trabajo', color: '#fff' }],
          days: { '2026-01-01': ['a'] },
        },
      ],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(legacy))

    const loaded = loadData()
    expect(loaded?.planners[0].days['2026-01-01']).toEqual([{ tagId: 'a' }])
    expect(loaded?.planners[0].tagTypes.map((t) => t.id)).toEqual([
      'trabajo',
      'local',
      'regional',
      'nacional',
    ])
  })
})

describe('exportToJson / importFromJson', () => {
  it('round-trips planners', () => {
    const planners = [createPlanner(2026), createPlanner(2030)]
    const imported = importFromJson(exportToJson(planners))
    expect(imported).toEqual(planners)
  })

  it('rejects invalid JSON with an ES/ES message', () => {
    expect(() => importFromJson('esto no es json')).toThrow('El archivo no es un JSON válido.')
  })

  it('rejects valid JSON that is not an export', () => {
    expect(() => importFromJson('{"hola":1}')).toThrow(
      'El archivo no tiene el formato de un export del planificador.',
    )
    expect(() => importFromJson('{"version":2,"planners":[]}')).toThrow(
      'El archivo no tiene el formato de un export del planificador.',
    )
  })

  it('rejects a planner with malformed dates', () => {
    const data = sampleData()
    data.planners[0].days['01-01-2026'] = [{ tagId: 'a' }]
    expect(() => importFromJson(JSON.stringify(data))).toThrow(
      'El archivo no tiene el formato de un export del planificador.',
    )
  })

  it('rejects a tag with an empty category', () => {
    const data = sampleData()
    const bad = data.planners[0]
    bad.tags = [{ id: 'x', label: 'X', category: '', color: '#fff' }]
    expect(() => importFromJson(JSON.stringify(data))).toThrow(
      'El archivo no tiene el formato de un export del planificador.',
    )
  })

  it('accepts a tag with a user-defined type id', () => {
    const data = sampleData()
    const planner = data.planners[0]
    planner.tagTypes = [...planner.tagTypes, { id: 'turno', label: 'Turno' }]
    planner.tags = [{ id: 'x', label: 'X', category: 'turno', color: '#fff' }]
    expect(importFromJson(JSON.stringify(data))[0].tags[0].category).toBe('turno')
  })

  it('normalizes a legacy export (string day ids, no tagTypes)', () => {
    const legacy = {
      version: 1,
      planners: [
        {
          id: 'p1',
          year: 2026,
          name: 'Planificador 2026',
          status: 'activo',
          tags: [{ id: 'a', label: 'A', category: 'trabajo', color: '#fff' }],
          days: { '2026-01-01': ['a'], '2026-01-02': ['a'] },
        },
      ],
    }
    const imported = importFromJson(JSON.stringify(legacy))
    expect(imported[0].days['2026-01-01']).toEqual([{ tagId: 'a' }])
    expect(imported[0].tagTypes).toHaveLength(4)
  })

  it('trims and shortens oversized subtitles on import', () => {
    const data = sampleData()
    data.planners[0].days['2026-01-01'] = [{ tagId: 'a', subtitle: `  ${'x'.repeat(120)}  ` }]
    const imported = importFromJson(JSON.stringify(data))
    expect(imported[0].days['2026-01-01'][0].subtitle).toHaveLength(60)
  })

  it('accepts an empty planner list', () => {
    expect(importFromJson(exportToJson([]))).toEqual([])
  })
})

describe('planner validation bounds', () => {
  it('rejects a year outside 1900-2200', () => {
    const data = sampleData()
    data.planners[0].year = 1800
    expect(() => importFromJson(JSON.stringify(data))).toThrow(
      'El archivo no tiene el formato de un export del planificador.',
    )
  })
})
