import type { DayTag, Tag } from '../types'
import { MONTH_NAMES, WEEKDAY_NAMES, weeksOfMonth } from '../utils/dates'
import type { Stats } from '../utils/stats'
import { WeekRow } from './WeekRow'
import { StatsBar } from './StatsBar'

interface MonthZoomProps {
  year: number
  /** Month index 0-11. */
  month: number
  daysData: Record<string, DayTag[]>
  tags: Tag[]
  readOnly: boolean
  clearing: boolean
  /** Statistics of this month, shown at the bottom of the planner. */
  stats: Stats
  onDayClick: (date: string) => void
  onTagOpen: (date: string, tagId: string) => void
  onTagRemove: (date: string, tagId: string) => void
  /** Close the zoom and go back to the year view. */
  onClose: () => void
}

/**
 * Month zoom: overlaps the year view (fixed overlay).
 * Wide cells showing full weekday names and full tag labels.
 */
export function MonthZoom({
  year,
  month,
  daysData,
  tags,
  readOnly,
  clearing,
  stats,
  onDayClick,
  onTagOpen,
  onTagRemove,
  onClose,
}: MonthZoomProps) {
  const weeks = weeksOfMonth(year, month)

  return (
    <div className="zoom" role="dialog" aria-modal="false" aria-label={`${MONTH_NAMES[month]} ${year}`}>
      <div className="zoom__bar">
        <button type="button" className="btn" onClick={onClose}>
          ← Volver al año
        </button>
        <h2 className="zoom__title">
          {MONTH_NAMES[month]} {year}
        </h2>
        <span className="spacer" />
        <span className="zoom__hint">
          {readOnly
            ? 'Planner archivado — solo lectura'
            : 'Clic en un día = aplicar la etiqueta activa · clic en la etiqueta = ver detalle · doble clic o mantener pulsado = quitarla'}
        </span>
      </div>

      <div className="zoom__grid" role="grid">
        <div className="zoom__row zoom__row--head" role="row">
          {WEEKDAY_NAMES.map((name, index) => (
            <span
              key={name}
              className={`zoom__dow${index >= 5 ? ' zoom__dow--we' : ''}`}
              role="columnheader"
            >
              {name}
            </span>
          ))}
        </div>
        {weeks.map((week, index) => (
          <div className="zoom__row" role="row" key={index}>
            <WeekRow
              days={week}
              daysData={daysData}
              tags={tags}
              readOnly={readOnly}
              clearing={clearing}
              variant="month"
              onDayClick={onDayClick}
              onTagOpen={onTagOpen}
              onTagRemove={onTagRemove}
            />
          </div>
        ))}
      </div>

      <StatsBar stats={stats} className="zoom__stats" />
    </div>
  )
}
