import type { Tag } from '../types'
import { isoDate } from '../utils/dates'
import { DayCell } from './DayCell'

interface WeekRowProps {
  days: (Date | null)[]
  daysData: Record<string, string[]>
  tags: Tag[]
  readOnly: boolean
  variant: 'year' | 'month'
  onDayClick: (date: string) => void
  onTagClick: (date: string, tagId: string) => void
}

/** One Monday-first week: 7 day slots (null = outside the month). */
export function WeekRow({
  days,
  daysData,
  tags,
  readOnly,
  variant,
  onDayClick,
  onTagClick,
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
        const dayTags = (daysData[iso] ?? [])
          .map((id) => tagById.get(id))
          .filter((tag): tag is Tag => tag !== undefined)
        return (
          <DayCell
            key={iso}
            date={date}
            tags={dayTags}
            readOnly={readOnly}
            variant={variant}
            onDayClick={onDayClick}
            onTagClick={onTagClick}
          />
        )
      })}
    </div>
  )
}
