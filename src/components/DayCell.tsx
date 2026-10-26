import { useEffect, useRef } from 'react'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import type { Tag } from '../types'
import { MAX_TAGS_PER_DAY } from '../types'
import { WEEKDAY_INITIALS, isoDate, isWeekend } from '../utils/dates'

/** One tag applied on a day, resolved for display (with its subtitle). */
export interface DayEntry {
  tag: Tag
  subtitle?: string
}

/** Delay before the detail modal opens, so a double click can be detected. */
const OPEN_DELAY = 250
/** Press-and-hold duration that removes the tag directly (touch friendly). */
const HOLD_DELAY = 600

interface DayCellProps {
  date: Date
  entries: DayEntry[]
  /** When true the day cannot be edited (archived planner). */
  readOnly: boolean
  /** Clearing mode: a chip click empties the day instead of opening the modal. */
  clearing: boolean
  /** Click on the empty area: apply the active tag (or clear when clearing). */
  onDayClick: (date: string) => void
  /** One click on a chip (debounced): show the tag detail modal. */
  onTagOpen: (date: string, tagId: string) => void
  /** Double click / press-and-hold on a chip: remove it from the day. */
  onTagRemove: (date: string, tagId: string) => void
  /** Month view shows tag labels instead of only colored chips. */
  variant: 'year' | 'month'
}

/** One day: number, weekday initial and its applied tag chips. */
export function DayCell({
  date,
  entries,
  readOnly,
  clearing,
  onDayClick,
  onTagOpen,
  onTagRemove,
  variant,
}: DayCellProps) {
  const iso = isoDate(date)
  const full = entries.length >= MAX_TAGS_PER_DAY
  const weekend = isWeekend(date)

  function handleDayClick() {
    if (readOnly) return
    onDayClick(iso)
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
        {entries.map((entry) => (
          <TagChip
            key={entry.tag.id}
            entry={entry}
            iso={iso}
            readOnly={readOnly}
            clearing={clearing}
            variant={variant}
            onOpen={onTagOpen}
            onRemove={onTagRemove}
          />
        ))}
      </span>
    </div>
  )
}

interface TagChipProps {
  entry: DayEntry
  iso: string
  readOnly: boolean
  clearing: boolean
  variant: 'year' | 'month'
  onOpen: (date: string, tagId: string) => void
  onRemove: (date: string, tagId: string) => void
}

/**
 * An applied tag inside a day. One click opens the detail modal (after
 * OPEN_DELAY so a double click can be told apart), double click or a
 * HOLD_DELAY press removes it from the day.
 */
function TagChip({ entry, iso, readOnly, clearing, variant, onOpen, onRemove }: TagChipProps) {
  const { tag, subtitle } = entry
  const openTimer = useRef<number | null>(null)
  const holdTimer = useRef<number | null>(null)
  // Set by a long press, consumed by the click that follows the release.
  const suppressClick = useRef(false)

  useEffect(
    () => () => {
      if (openTimer.current !== null) window.clearTimeout(openTimer.current)
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
    },
    [],
  )

  function clearOpenTimer() {
    if (openTimer.current !== null) {
      window.clearTimeout(openTimer.current)
      openTimer.current = null
    }
  }

  function clearHoldTimer() {
    if (holdTimer.current !== null) {
      window.clearTimeout(holdTimer.current)
      holdTimer.current = null
    }
  }

  function handlePointerDown(_event: PointerEvent<HTMLButtonElement>) {
    if (readOnly || clearing) return
    suppressClick.current = false
    clearHoldTimer()
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = null
      suppressClick.current = true
      clearOpenTimer() // nothing must open: the tag is being removed
      onRemove(iso, tag.id)
      // The chip unmounts on removal, so the release click may hit the day
      // underneath and fill it by mistake: swallow that one trailing click.
      swallowNextClick()
    }, HOLD_DELAY)
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (readOnly) return
    if (suppressClick.current) {
      suppressClick.current = false
      return
    }
    // Clearing mode keeps the old behaviour: one click empties the day.
    if (clearing) {
      onRemove(iso, tag.id)
      return
    }
    if (openTimer.current !== null) {
      // Second click inside the debounce window = double click → remove.
      clearOpenTimer()
      onRemove(iso, tag.id)
      return
    }
    openTimer.current = window.setTimeout(() => {
      openTimer.current = null
      onOpen(iso, tag.id)
    }, OPEN_DELAY)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    // Keep Enter/Space from bubbling to the day (which would fill it).
    event.stopPropagation()
  }

  const title = readOnly
    ? `${tag.label}\nsolo lectura`
    : clearing
      ? `${tag.label}\nclic para vaciar el día`
      : `${tag.label}${subtitle ? ` — ${subtitle}` : ''}\nClic: detalle\nDoble clic: quitar`

  return (
    <button
      type="button"
      className={`tag-chip tag-chip--${variant}${readOnly ? '' : ' tag-chip--removable'}`}
      style={{ backgroundColor: tag.color, color: contrastOn(tag.color) }}
      title={title}
      disabled={readOnly}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={clearHoldTimer}
      onPointerLeave={clearHoldTimer}
      onPointerCancel={clearHoldTimer}
      onKeyDown={handleKeyDown}
    >
      {variant === 'month' ? (
        <>
          <span className="tag-chip__label">{tag.label}</span>
          {subtitle ? <span className="tag-chip__sub">{subtitle}</span> : null}
        </>
    ) : (
      ''
    )}
    </button>
  )
}

/**
 * One-shot: ignore the click produced when a long-press release lands
 * outside the (already removed) chip. Disarmed by that click or by the
 * next pointer press, so normal interaction always resumes.
 */
function swallowNextClick() {
  function disarm() {
    document.removeEventListener('click', swallow, true)
    document.removeEventListener('pointerdown', disarm, true)
  }
  function swallow(event: Event) {
    event.stopPropagation()
    event.preventDefault()
    disarm()
  }
  document.addEventListener('click', swallow, true)
  document.addEventListener('pointerdown', disarm, true)
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
