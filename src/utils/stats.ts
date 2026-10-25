import type { DayTag, Tag } from '../types'

export interface Stats {
  /** Count per tag id, in planner tag order. */
  counts: { tag: Tag; count: number }[]
  /** Days in the period with no tag at all. */
  untagged: number
}

/**
 * Count how many days carry each tag within `isoDays`.
 * Untagged counts the days of `isoDays` with no tags.
 */
export function computeStats(
  tagIdsByDay: Record<string, DayTag[]>,
  tags: Tag[],
  isoDays: string[],
): Stats {
  const counts = new Map<string, number>(tags.map((tag) => [tag.id, 0]))
  let untagged = 0

  for (const iso of isoDays) {
    const dayTags = tagIdsByDay[iso]
    if (!dayTags || dayTags.length === 0) {
      untagged++
      continue
    }
    let counted = false
    for (const entry of dayTags) {
      if (counts.has(entry.tagId)) {
        counts.set(entry.tagId, (counts.get(entry.tagId) ?? 0) + 1)
        counted = true
      }
    }
    if (!counted) untagged++
  }

  return {
    counts: tags.map((tag) => ({ tag, count: counts.get(tag.id) ?? 0 })),
    untagged,
  }
}
