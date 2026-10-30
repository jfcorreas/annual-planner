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

  it('accepts and round-trips the new tag shape without category or tagTypes', () => {
    const data: AppData = {
      version: 1,
      planners: [
        {
          id: 'p1',
          year: 2026,
          name: 'Planificador 2026',
          status: 'activo',
          tags: [{ id: 'x', label: 'Sin tipo', color: '#fff' }],
          days: { '2026-01-01': [{ tagId: 'x' }] },
        },
      ],
    }

    saveData(data)
    expect(loadData()).toEqual(data)
    expect(importFromJson(JSON.stringify(data))).toEqual(data.planners)
  })

  it('round-trips day subtitles through localStorage', () => {
    const data = sampleData()
    data.planners[0].days['2026-01-01'] = [{ tagId: 'guardia-24h', subtitle: 'de tarde' }]
    saveData(data)
    expect(loadData()?.planners[0].days['2026-01-01']).toEqual([
      { tagId: 'guardia-24h', subtitle: 'de tarde' },
    ])
  })

  it('normalizes legacy data (string day ids) on load', () => {
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

  it('normalizes a legacy export (string day ids)', () => {
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
