import type { DayEntry } from './DayCell'
import { formatIsoDate, weekdayOfIso } from '../utils/dates'
import { tagIcon } from '../utils/tags'

interface DayDetailModalProps {
  /** ISO date (yyyy-MM-dd) of the day being inspected. */
  date: string
  /** Every tag applied on the day, with its subtitle. */
  entries: DayEntry[]
  onClose: () => void
}

/**
 * Modal opened with one click on a day number (year view and month zoom,
 * any device): shows the date and every tag of the day in full — labels and
 * subtitles are never clipped. Read-only: editing stays on the chips.
 */
export function DayDetailModal({ date, entries, onClose }: DayDetailModalProps) {
  const weekday = weekdayOfIso(date)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal--day-detail"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle del día ${formatIsoDate(date)}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__head">
          <h2 className="day-detail__title">
            📅 {weekday ? `${weekday}, ` : ''}
            {formatIsoDate(date)}
          </h2>
          <button type="button" className="btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>

        {entries.length === 0 ? (
          <p className="day-detail__empty">Sin etiquetas este día.</p>
        ) : (
          <ul className="day-detail__list">
            {entries.map((entry) => (
              <li key={entry.tag.id} className="day-detail__item">
                <span className="stats__swatch" style={{ backgroundColor: entry.tag.color }} />
                <span className="day-detail__text">
                  <span className="day-detail__label">
                    {tagIcon(entry.tag, { showGlobal: true })}
                    {entry.tag.label}
                  </span>
                  {entry.subtitle ? (
                    <span className="day-detail__sub">{entry.subtitle}</span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
