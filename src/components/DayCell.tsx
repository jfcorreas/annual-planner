import type { MouseEvent } from 'react'
import type { Tag } from '../types'
import { MAX_TAGS_PER_DAY } from '../types'
import { WEEKDAY_INITIALS, isoDate, isWeekend } from '../utils/dates'

interface DayCellProps {
  date: Date
  tags: Tag[]
  /** When true the day cannot be edited (archived planner). */
  readOnly: boolean
  /** Click on the empty area: apply the active tag (or clear when clearing). */
  onDayClick: (date: string) => void
  /** Click on an applied tag chip: remove that tag. */
  onTagClick: (date: string, tagId: string) => void
  /** Month view shows tag labels instead of only colored chips. */
  variant: 'year' | 'month'
}

/** One day: number, weekday initial and its applied tag chips. */
export function DayCell({
  date,
  tags,
  readOnly,
  onDayClick,
  onTagClick,
  variant,
}: DayCellProps) {
  const iso = isoDate(date)
  const full = tags.length >= MAX_TAGS_PER_DAY
  const weekend = isWeekend(date)

  function handleDayClick() {
    if (readOnly) return
    onDayClick(iso)
  }

  function handleTagClick(event: MouseEvent<HTMLButtonElement>, tagId: string) {
    event.stopPropagation()
    if (readOnly) return
    onTagClick(iso, tagId)
  }

  const title = readOnly
    ? `${iso} — planner archivado (solo lectura)`
    : full
      ? `${iso} — máximo ${MAX_TAGS_PER_DAY} etiquetas por día`
      : iso

  return (
    <div
      className={`day${weekend ? ' day--weekend' : ''}${readOnly ? ' day--readonly' : ''}`}
      data-iso={iso}
      title={title}
      onClick={handleDayClick}
      role={readOnly ? undefined : 'button'}
      tabIndex={readOnly ? undefined : 0}
      onKeyDown={(e) => {
        if (!readOnly && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          handleDayClick()
        }
      }}
    >
      <span className="day__number">{String(date.getDate()).padStart(2, '0')}</span>
      <span className="day__weekday">{WEEKDAY_INITIALS[(date.getDay() + 6) % 7]}</span>
      <span className="day__tags">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            className={`tag-chip tag-chip--${variant}${readOnly ? '' : ' tag-chip--removable'}`}
            style={{ backgroundColor: tag.color, color: contrastOn(tag.color) }}
            title={readOnly ? `${tag.label} — solo lectura` : `Quitar “${tag.label}”`}
            disabled={readOnly}
            onClick={(e) => handleTagClick(e, tag.id)}
          >
            {variant === 'month' ? tag.label : ''}
          </button>
        ))}
      </span>
    </div>
  )
}

/** Black or white text depending on the chip background luminance. */
function contrastOn(hex: string): string {
  const value = hex.replace('#', '')
  if (value.length !== 6) return '#000'
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  // Relative luminance (sRGB approximation)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.6 ? '#1f2937' : '#ffffff'
}
