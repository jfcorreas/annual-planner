import type { DayTag, Tag } from '../types'

export interface Stats {
  /** Count per tag id, in planner tag order (non-permit tags only). */
  counts: { tag: Tag; count: number }[]
  /** Permit tags in their own group, after the regular ones. */
  permits: { tag: Tag; count: number }[]
}

/**
 * Count how many days carry each tag within `isoDays`.
 * Permit tags bypass the "included in statistics" filter and get their
 * own group at the end.
 */
export function computeStats(
  tagIdsByDay: Record<string, DayTag[]>,
  tags: Tag[],
  isoDays: string[],
): Stats {
  const included = tags.filter((tag) => tag.inStats !== false && !tag.permit)
  const permits = tags.filter((tag) => tag.permit === true)
  const counts = new Map<string, number>([...included, ...permits].map((tag) => [tag.id, 0]))

  for (const iso of isoDays) {
    const dayTags = tagIdsByDay[iso]
    if (!dayTags) continue
    for (const entry of dayTags) {
      if (counts.has(entry.tagId)) {
        counts.set(entry.tagId, (counts.get(entry.tagId) ?? 0) + 1)
      }
    }
  }

  const row = (tag: Tag) => ({ tag, count: counts.get(tag.id) ?? 0 })
  return {
    counts: included.map(row),
    permits: permits.map(row),
  }
}
