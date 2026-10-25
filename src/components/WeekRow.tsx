import type { DayTag, Tag } from '../types'
import { isoDate } from '../utils/dates'
import { DayCell } from './DayCell'
import type { DayEntry } from './DayCell'

interface WeekRowProps {
  days: (Date | null)[]
  daysData: Record<string, DayTag[]>
  tags: Tag[]
  readOnly: boolean
  clearing: boolean
  variant: 'year' | 'month'
  onDayClick: (date: string) => void
  onTagOpen: (date: string, tagId: string) => void
  onTagRemove: (date: string, tagId: string) => void
}

/** One Monday-first week: 7 day slots (null = outside the month). */
export function WeekRow({
  days,
  daysData,
  tags,
  readOnly,
  clearing,
  variant,
  onDayClick,
  onTagOpen,
  onTagRemove,
}: WeekRowProps) {
  const tagById = new Map(tags.map((tag) => [tag.id, tag]))

  return (
    <div className={`week week--${variant}`}>
      {days.map((date, index) => {
        // The year view lists days sequentially (no leading blanks like the month grid).
        if (!date) {
          return variant === 'month' ? (
            <span key={`empty-${index}`} className="day day--empty" aria-hidden="true" />
          ) : null
        }
        const iso = isoDate(date)
        const entries: DayEntry[] = (daysData[iso] ?? [])
          .map((entry): DayEntry | null => {
            const tag = tagById.get(entry.tagId)
            return tag ? { tag, subtitle: entry.subtitle } : null
          })
          .filter((entry): entry is DayEntry => entry !== null)
        return (
          <DayCell
            key={iso}
            date={date}
            entries={entries}
            readOnly={readOnly}
            clearing={clearing}
            variant={variant}
            onDayClick={onDayClick}
            onTagOpen={onTagOpen}
            onTagRemove={onTagRemove}
          />
        )
      })}
    </div>
  )
}
