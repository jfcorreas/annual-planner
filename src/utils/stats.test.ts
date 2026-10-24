import { describe, expect, it } from 'vitest'
import type { Tag } from '../types'
import { computeStats } from './stats'

const TAGS: Tag[] = [
  { id: 'a', label: 'Etiqueta A', category: 'trabajo', color: '#facc15' },
  { id: 'b', label: 'Etiqueta B', category: 'local', color: '#86efac' },
]

describe('computeStats', () => {
  it('counts one occurrence per day, even with 2 tags on it', () => {
    const days = { '2026-01-01': ['a'], '2026-01-02': ['a', 'b'] }
    const stats = computeStats(days, TAGS, ['2026-01-01', '2026-01-02'])

    expect(stats.counts.find((c) => c.tag.id === 'a')?.count).toBe(2)
    expect(stats.counts.find((c) => c.tag.id === 'b')?.count).toBe(1)
  })

  it('counts days without tags as untagged', () => {
    const stats = computeStats({}, TAGS, ['2026-01-01', '2026-01-02', '2026-01-03'])
    expect(stats.untagged).toBe(3)
    expect(stats.counts.every((c) => c.count === 0)).toBe(true)
  })

  it('only counts the requested period (year vs month subset)', () => {
    const days = { '2026-01-01': ['a'], '2026-02-01': ['a'] }
    const january = computeStats(days, TAGS, ['2026-01-01'])
    expect(january.counts[0].count).toBe(1)

    const year = computeStats(days, TAGS, ['2026-01-01', '2026-02-01'])
    expect(year.counts[0].count).toBe(2)
  })

  it('ignores unknown tag ids (corrupt data) without crashing', () => {
    const days = { '2026-01-01': ['ghost'] }
    const stats = computeStats(days, TAGS, ['2026-01-01'])
    expect(stats.counts.every((c) => c.count === 0)).toBe(true)
    // A day whose only ids are unknown counts as untagged.
    expect(stats.untagged).toBe(1)
  })

  it('keeps planner tag order in the counts', () => {
    const stats = computeStats({}, TAGS, [])
    expect(stats.counts.map((c) => c.tag.id)).toEqual(['a', 'b'])
  })
})
