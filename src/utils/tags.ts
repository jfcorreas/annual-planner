import type { Planner, Tag } from '../types'

/**
 * Icons shown before a tag's name: 🏖️ for holidays, 🪪 for work permits.
 * `showGlobal` adds 🌐 for global tags, only where the badge belongs
 * (tags editor and detail modal). Empty string for a plain tag with no
 * icons (trailing space included, `''` is falsy).
 */
export function tagIcon(tag: Tag, options: { showGlobal?: boolean } = {}): string {
  const icons: string[] = []
  if (tag.holiday) icons.push('🏖️')
  else if (tag.permit) icons.push('🪪')
  if (options.showGlobal && tag.global) icons.push('🌐')
  return icons.length > 0 ? `${icons.join(' ')} ` : ''
}

/**
 * Usage of a tag across planners: total applications and how many planners
 * carry at least one. `excludePlannerId` supports the unmark guard, which
 * only cares about the other planners.
 */
export function tagUsageAcrossPlanners(
  planners: Planner[],
  tagId: string,
  excludePlannerId?: string,
): { days: number; planners: number } {
  let days = 0
  let plannerCount = 0
  for (const planner of planners) {
    if (planner.id === excludePlannerId) continue
    let count = 0
    for (const entries of Object.values(planner.days)) {
      for (const entry of entries) {
        if (entry.tagId === tagId) count++
      }
    }
    if (count > 0) {
      days += count
      plannerCount += 1
    }
  }
  return { days, planners: plannerCount }
}
