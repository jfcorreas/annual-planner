import type { DayTag, Tag } from '../types'
import { MONTH_NAMES, weeksOfMonth } from '../utils/dates'
import { WeekRow } from './WeekRow'

interface MonthColumnProps {
  year: number
  /** Month index 0-11. */
  month: number
  daysData: Record<string, DayTag[]>
  tags: Tag[]
  readOnly: boolean
  clearing: boolean
  onDayClick: (date: string) => void
  onTagOpen: (date: string, tagId: string) => void
  onTagRemove: (date: string, tagId: string) => void
  /** Click on the month title: zoom into the month. */
  onZoom: (month: number) => void
}

/** One month of the year view: title + list of week rows. */
export function MonthColumn({
  year,
  month,
  daysData,
  tags,
  readOnly,
  clearing,
  onDayClick,
  onTagOpen,
  onTagRemove,
  onZoom,
}: MonthColumnProps) {
  const weeks = weeksOfMonth(year, month)

  return (
    <section className="month-col" aria-label={MONTH_NAMES[month]}>
      <h2 className="month-col__title">
        <button
          type="button"
          className="month-col__zoom"
          onClick={() => onZoom(month)}
          title={`Ampliar ${MONTH_NAMES[month]}`}
        >
          {MONTH_NAMES[month]}
        </button>
      </h2>
      <div className="month-col__weeks">
        {weeks.map((week, index) => (
          <WeekRow
            key={index}
            days={week}
            daysData={daysData}
            tags={tags}
            readOnly={readOnly}
            clearing={clearing}
            variant="year"
            onDayClick={onDayClick}
            onTagOpen={onTagOpen}
            onTagRemove={onTagRemove}
          />
        ))}
      </div>
    </section>
  )
}
