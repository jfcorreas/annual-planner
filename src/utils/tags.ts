import type { Tag } from '../types'

/**
 * Icon shown before a tag's name: 🏖️ for holidays, 🪪 for work permits.
 * Empty string for regular tags (trailing space included, `''` is falsy).
 */
export function tagIcon(tag: Tag): string {
  if (tag.holiday) return '🏖️ '
  if (tag.permit) return '🪪 '
  return ''
}
