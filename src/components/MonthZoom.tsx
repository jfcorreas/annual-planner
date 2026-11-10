import { useEffect, useRef } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import type { DayTag, Tag } from '../types'
import { MONTH_NAMES, WEEKDAY_INITIALS, WEEKDAY_NAMES, weeksOfMonth } from '../utils/dates'
import type { Stats } from '../utils/stats'
import { WeekRow } from './WeekRow'
import { StatsBar } from './StatsBar'

/** Horizontal distance (px) a drag must cover before it changes the month. */
const SWIPE_MIN = 48
/** How much wider than tall the drag has to be, to ignore diagonal scrolls. */
const SWIPE_RATIO = 1.2

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
  onDayInfo: (date: string) => void
  onTagOpen: (date: string, tagId: string) => void
  onTagRemove: (date: string, tagId: string) => void
  /** Close the zoom and go back to the year view. */
  onClose: () => void
  /** Show the previous month of the same year. */
  onPrev: () => void
  /** Show the next month of the same year. */
  onNext: () => void
}

/**
 * Month zoom: overlaps the year view (fixed overlay).
 * Wide cells showing full weekday names and full tag labels.
 * A lateral drag (touch or mouse) over the overlay moves to the
 * neighbouring month, like the ◀ ▶ buttons.
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
  onDayInfo,
  onTagOpen,
  onTagRemove,
  onClose,
  onPrev,
  onNext,
}: MonthZoomProps) {
  const weeks = weeksOfMonth(year, month)
  const rootRef = useRef<HTMLDivElement>(null)
  /** Pointer that started the current drag (cleared once it becomes a swipe). */
  const drag = useRef<{ id: number; x: number; y: number } | null>(null)
  /** Set while a swipe navigates: the click it leaves behind must do nothing. */
  const swiped = useRef(false)

  // A swipe can be fired while scrolled down on the stats panel; the new
  // month must open showing its grid.
  useEffect(() => {
    if (rootRef.current) rootRef.current.scrollTop = 0
  }, [month])

  /** Lateral drag over the zoom = go to the neighbouring month. */
  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY }
    swiped.current = false
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    const start = drag.current
    if (!start || start.id !== event.pointerId || swiped.current) return
    // A hover (mouse/pen with no button down) must not reuse a stale origin.
    if (event.pointerType !== 'touch' && event.buttons === 0) {
      drag.current = null
      return
    }
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.abs(dx) < SWIPE_MIN || Math.abs(dx) < Math.abs(dy) * SWIPE_RATIO) return
    drag.current = null
    swiped.current = true
    // Finger to the left = next month, to the right = previous one.
    if (dx < 0) {
      if (month < 11) onNext()
    } else if (month > 0) {
      onPrev()
    }
  }

  function releasePointer(event: PointerEvent<HTMLDivElement>) {
    if (drag.current?.id === event.pointerId) drag.current = null
  }

  /** The swipe already navigated: swallow the click it may leave behind. */
  function handleClickCapture(event: MouseEvent<HTMLDivElement>) {
    if (!swiped.current) return
    swiped.current = false
    event.stopPropagation()
    event.preventDefault()
  }

  return (
    <div
      className="zoom"
      ref={rootRef}
      role="dialog"
      aria-modal="false"
      aria-label={`${MONTH_NAMES[month]} ${year}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={releasePointer}
      onPointerCancel={releasePointer}
      onClickCapture={handleClickCapture}
    >
      <div className="zoom__bar">
        <button type="button" className="btn" onClick={onClose}>
          ← Volver al año
        </button>
        <button
          type="button"
          className="btn"
          onClick={onPrev}
          disabled={month === 0}
        >
          ◀ {MONTH_NAMES[(month + 11) % 12]}
        </button>
        <h2 className="zoom__title">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button
          type="button"
          className="btn"
          onClick={onNext}
          disabled={month === 11}
        >
          {MONTH_NAMES[(month + 1) % 12]} ▶
        </button>
        <span className="spacer" />
        <span className="zoom__hint">
          {readOnly
            ? 'Planner archivado — solo lectura'
            : 'Clic en un día = aplicar la etiqueta activa · clic en el número = detalle del día · clic en la etiqueta = ver detalle · doble clic o mantener pulsado = quitarla'}
        </span>
      </div>

      <div className="zoom__grid" role="grid">
        <div className="zoom__row zoom__row--head" role="row">
          {WEEKDAY_NAMES.map((name, index) => (
            <span
              key={name}
              className={`zoom__dow${index >= 5 ? ' zoom__dow--we' : ''}`}
              role="columnheader"
              aria-label={name}
            >
              {/* Portrait phones show the initial only (narrow label column). */}
              <span className="zoom__dow-full">{name}</span>
              <span className="zoom__dow-short" aria-hidden="true">
                {WEEKDAY_INITIALS[index]}
              </span>
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
              onDayInfo={onDayInfo}
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
