import type { Tag } from '../types'
import { MONTH_NAMES } from '../utils/dates'
import { MonthColumn } from './MonthColumn'

interface YearViewProps {
  year: number
  daysData: Record<string, string[]>
  tags: Tag[]
  readOnly: boolean
  onDayClick: (date: string) => void
  onTagClick: (date: string, tagId: string) => void
  onZoom: (month: number) => void
}

/** Full-year view: 12 month columns. */
export function YearView({
  year,
  daysData,
  tags,
  readOnly,
  onDayClick,
  onTagClick,
  onZoom,
}: YearViewProps) {
  return (
    <div className="year-view" aria-label={`Vista anual ${year}`}>
      {MONTH_NAMES.map((_, month) => (
        <MonthColumn
          key={month}
          year={year}
          month={month}
          daysData={daysData}
          tags={tags}
          readOnly={readOnly}
          onDayClick={onDayClick}
          onTagClick={onTagClick}
          onZoom={onZoom}
        />
      ))}
    </div>
  )
}
