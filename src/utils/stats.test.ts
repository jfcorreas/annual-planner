import { describe, expect, it } from 'vitest'
import type { Tag } from '../types'
import { computeStats } from './stats'

const TAGS: Tag[] = [
  { id: 'a', label: 'Etiqueta A', color: '#facc15' },
  { id: 'b', label: 'Etiqueta B', color: '#86efac' },
]

/** Build a day entry list from plain tag ids (like the app does after load). */
const day = (...ids: string[]) => ids.map((tagId) => ({ tagId }))

describe('computeStats', () => {
  it('counts one occurrence per day, even with 2 tags on it', () => {
    const days = { '2026-01-01': day('a'), '2026-01-02': day('a', 'b') }
    const stats = computeStats(days, TAGS, ['2026-01-01', '2026-01-02'])

    expect(stats.counts.find((c) => c.tag.id === 'a')?.count).toBe(2)
    expect(stats.counts.find((c) => c.tag.id === 'b')?.count).toBe(1)
  })

  it('only counts the requested period (year vs month subset)', () => {
    const days = { '2026-01-01': day('a'), '2026-02-01': day('a') }
    const january = computeStats(days, TAGS, ['2026-01-01'])
    expect(january.counts[0].count).toBe(1)

    const year = computeStats(days, TAGS, ['2026-01-01', '2026-02-01'])
    expect(year.counts[0].count).toBe(2)
  })

  it('ignores unknown tag ids (corrupt data) without crashing', () => {
    const days = { '2026-01-01': day('ghost') }
    const stats = computeStats(days, TAGS, ['2026-01-01'])
    expect(stats.counts.every((c) => c.count === 0)).toBe(true)
  })

  it('ignores subtitles when counting (they belong to the application)', () => {
    const days = { '2026-01-01': [{ tagId: 'a', subtitle: 'tarde' }] }
    const stats = computeStats(days, TAGS, ['2026-01-01'])
    expect(stats.counts.find((c) => c.tag.id === 'a')?.count).toBe(1)
  })

  it('keeps planner tag order in the counts', () => {
    const stats = computeStats({}, TAGS, [])
    expect(stats.counts.map((c) => c.tag.id)).toEqual(['a', 'b'])
  })

  it('counts only tags marked as included', () => {
    const tags: Tag[] = [
      { id: 'a', label: 'Etiqueta A', color: '#facc15' },
      { id: 'b', label: 'Etiqueta B', color: '#86efac', inStats: false },
    ]
    const days = { '2026-01-01': day('a', 'b') }
    const stats = computeStats(days, tags, ['2026-01-01'])

    expect(stats.counts.map((c) => c.tag.id)).toEqual(['a'])
  })

  it('counts tags without the flag as included (old data)', () => {
    // Data saved before the flag existed has no `inStats` property at all.
    const oldTag = { id: 'old', label: 'Etiqueta antigua', color: '#facc15' } as Tag
    const days = { '2026-01-01': day('old') }
    const stats = computeStats(days, [oldTag], ['2026-01-01', '2026-01-02'])

    expect(stats.counts).toEqual([{ tag: oldTag, count: 1 }])
  })
})
