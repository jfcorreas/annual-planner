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
 * Short text of a tag shown inside a day chip when the full label does not
 * fit: the uppercase initial of every word and the digits inside it
 * ("Guardia 24h" → "G24", "Turno 24h" → "T24", "Festivo local" → "F").
 * Lowercase words ("de", "local") are ignored, so a long label stays short.
 * Falls back to the first letter of every word when the label has no
 * capital at all (a lower-case label), so a chip is never empty.
 */
export function tagAcronym(label: string): string {
  const words = label.split(/[\s\-_/]+/).filter(Boolean)
  let acronym = ''
  for (const word of words) {
    const initial = word.match(/[A-ZÁÉÍÓÚÑÜ]/)?.[0] ?? ''
    const digits = word.match(/\d+/)?.[0] ?? ''
    acronym += initial + digits
  }
  if (acronym) return acronym
  const lowered = words.map((word) => word.charAt(0)).join('').toUpperCase()
  return lowered || '•'
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
