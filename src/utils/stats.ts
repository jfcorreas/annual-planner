import type { DayTag, Tag } from '../types'

export interface Stats {
  /** Count per tag id, in planner tag order. */
  counts: { tag: Tag; count: number }[]
}

/**
 * Count how many days carry each included tag within `isoDays`.
 */
export function computeStats(
  tagIdsByDay: Record<string, DayTag[]>,
  tags: Tag[],
  isoDays: string[],
): Stats {
  const included = tags.filter((tag) => tag.inStats !== false)
  const counts = new Map<string, number>(included.map((tag) => [tag.id, 0]))

  for (const iso of isoDays) {
    const dayTags = tagIdsByDay[iso]
    if (!dayTags) continue
    for (const entry of dayTags) {
      if (counts.has(entry.tagId)) {
        counts.set(entry.tagId, (counts.get(entry.tagId) ?? 0) + 1)
      }
    }
  }

  return {
    counts: included.map((tag) => ({ tag, count: counts.get(tag.id) ?? 0 })),
  }
}
