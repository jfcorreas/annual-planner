import { describe, expect, it } from 'vitest'
import type { AppData } from './types'
import { exportToJson, hasPreviousVersionData, importFromJson, loadData, saveData } from './storage'
import { createPlanner } from './defaults'

const STORAGE_KEY = 'annual-planner:v2'

function sampleData(): AppData {
  return { version: 2, planners: [createPlanner(2026)] }
}

describe('loadData / saveData', () => {
  it('round-trips data through localStorage under the v2 key with version 2', () => {
    const data = sampleData()
    saveData(data)
    expect(localStorage.getItem(STORAGE_KEY)).toContain('"version":2')
    expect(loadData()).toEqual(data)
  })

  it('returns null when nothing is stored', () => {
    expect(loadData()).toBeNull()
  })

  it('reports previous-version data when only the v1 entry exists', () => {
    // Fresh storage: nothing from a previous version yet.
    expect(hasPreviousVersionData()).toBe(false)

    const legacy = JSON.stringify({ version: 1, planners: [createPlanner(2026)] })
    localStorage.setItem('annual-planner:v1', legacy)
    expect(hasPreviousVersionData()).toBe(true)
    // Detection never touches the old entry.
    expect(localStorage.getItem('annual-planner:v1')).toBe(legacy)
  })

  it('returns null for corrupted JSON', () => {
    localStorage.setItem(STORAGE_KEY, '{no es json')
    expect(loadData()).toBeNull()
  })

  it('loadData accepts version 2 and rejects other versions', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, planners: [] }))
    expect(loadData()).toEqual({ version: 2, planners: [] })

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 3, planners: [] }))
    expect(loadData()).toBeNull()

    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, planners: [] }))
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
      version: 2,
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

  it('round-trips the statistics flag through localStorage', () => {
    const data = sampleData()
    data.planners[0].tags = [
      { id: 'counted', label: 'Contada', color: '#facc15', inStats: true },
      { id: 'skipped', label: 'Saltada', color: '#86efac', inStats: false },
      { id: 'legacy', label: 'Sin bandera', color: '#2f6fed' }, // old data: no flag
    ]

    saveData(data)
    expect(loadData()).toEqual(data)
    expect(importFromJson(JSON.stringify(data))).toEqual(data.planners)
  })

  it('round-trips the permit flag and its yearly max through localStorage', () => {
    const data = sampleData()
    data.planners[0].tags = [
      { id: 'permit', label: 'Permiso', color: '#0891b2', permit: true, maxPerYear: 10 },
      { id: 'plain', label: 'Normal', color: '#facc15', inStats: true }, // no permit fields
      { id: 'legacy', label: 'Sin bandera', color: '#2f6fed' }, // old data: no flags
    ]

    saveData(data)
    expect(loadData()).toEqual(data)
    expect(importFromJson(JSON.stringify(data))).toEqual(data.planners)

    const loaded = loadData()!.planners[0].tags
    expect(loaded[0].permit).toBe(true)
    expect(loaded[0].maxPerYear).toBe(10)
    // Tags without the fields load as non-permits (missing = not a permit).
    expect(loaded[1].permit).toBeUndefined()
    expect(loaded[1].maxPerYear).toBeUndefined()
    expect(loaded[2].permit).toBeUndefined()
    expect(loaded[2].maxPerYear).toBeUndefined()
  })

  it('round-trips the global flag through localStorage and export', () => {
    const data = sampleData()
    data.planners[0].tags = [
      { id: 'shared', label: 'Compartida', color: '#2f6fed', global: true },
      { id: 'local', label: 'Local', color: '#facc15' }, // no flag: local tag
    ]

    saveData(data)
    expect(loadData()).toEqual(data)
    expect(importFromJson(JSON.stringify(data))).toEqual(data.planners)

    const loaded = loadData()!.planners[0].tags
    expect(loaded[0].global).toBe(true)
    expect(loaded[1].global).toBeUndefined()
  })

  it('normalizes string day ids in a current-format (v2) file on load', () => {
    const current = {
      version: 2,
      planners: [
        {
          id: 'p1',
          year: 2026,
          name: 'Planificador 2026',
          status: 'activo',
          tags: [{ id: 'a', label: 'A', color: '#fff' }],
          days: { '2026-01-01': ['a'] },
        },
      ],
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))

    const loaded = loadData()
    expect(loaded?.planners[0].days['2026-01-01']).toEqual([{ tagId: 'a' }])
  })
})

describe('exportToJson / importFromJson', () => {
  it('exportToJson writes version 2', () => {
    const json = exportToJson([createPlanner(2026)])
    expect(JSON.parse(json).version).toBe(2)
  })

  it('round-trips planners', () => {
    const planners = [createPlanner(2026), createPlanner(2030)]
    const imported = importFromJson(exportToJson(planners))
    expect(imported).toEqual(planners)
  })

  it('rejects invalid JSON with an ES/ES message', () => {
    expect(() => importFromJson('esto no es json')).toThrow('El archivo no es un JSON válido.')
  })

  it('rejects a previous-version file with the specific ES/ES message', () => {
    const previous = { version: 1, planners: [createPlanner(2026)] }
    expect(() => importFromJson(JSON.stringify(previous))).toThrow(
      'El archivo es de una versión anterior y ya no es compatible.',
    )
  })

  it('importFromJson keeps the generic message for non-export JSON', () => {
    expect(() => importFromJson('{"hola":1}')).toThrow(
      'El archivo no tiene el formato de un export del planificador.',
    )
    expect(() => importFromJson('{"version":3,"planners":[]}')).toThrow(
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

  it('normalizes string day ids in a v2 import', () => {
    const current = {
      version: 2,
      planners: [
        {
          id: 'p1',
          year: 2026,
          name: 'Planificador 2026',
          status: 'activo',
          tags: [{ id: 'a', label: 'A', color: '#fff' }],
          days: { '2026-01-01': ['a'], '2026-01-02': ['a'] },
        },
      ],
    }
    const imported = importFromJson(JSON.stringify(current))
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
