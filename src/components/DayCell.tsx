import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react'
import type { Tag } from '../types'
import { MAX_TAGS_PER_DAY } from '../types'
import { WEEKDAY_INITIALS, isoDate, isWeekend } from '../utils/dates'
import { tagAcronym, tagIcon } from '../utils/tags'

/** One tag applied on a day, resolved for display (with its subtitle). */
export interface DayEntry {
  tag: Tag
  subtitle?: string
}

/** Delay before the detail modal opens, so a double click can be detected. */
const OPEN_DELAY = 250
/** Press-and-hold duration that removes the tag directly (touch friendly). */
const HOLD_DELAY = 600
/** Pointer movement (px) that turns the press into a drag (e.g. a month swipe). */
const MOVE_TOLERANCE = 10

interface DayCellProps {
  date: Date
  entries: DayEntry[]
  /** When true the day cannot be edited (archived planner). */
  readOnly: boolean
  /** Click on the empty area: apply the active tag, or show the day detail
   *  when no tag is selected (or the planner is archived). */
  onDayClick: (date: string) => void
  /** Click on the day number: show the day detail modal. */
  onDayInfo: (date: string) => void
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
  onDayClick,
  onDayInfo,
  onTagOpen,
  onTagRemove,
  variant,
}: DayCellProps) {
  const iso = isoDate(date)
  const full = entries.length >= MAX_TAGS_PER_DAY
  const weekend = isWeekend(date)

  function handleDayClick() {
    onDayClick(iso)
  }

  /** The number opens the day detail; it must not also fill the day. */
  function handleDayInfo(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    onDayInfo(iso)
  }

  const title = readOnly
    ? `${iso} — planner archivado (solo lectura)\nClic: detalle del día`
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
      <button
        type="button"
        className="day__number"
        title={`${iso}\nClic: detalle del día`}
        onClick={handleDayInfo}
        onKeyDown={(event) => {
          // Enter/Space must not reach the day (it would fill it); Escape
          // and everything else keep bubbling so modals can close.
          if (event.key === 'Enter' || event.key === ' ') event.stopPropagation()
        }}
      >
        {String(date.getDate()).padStart(2, '0')}
      </button>
      <span className="day__weekday">{WEEKDAY_INITIALS[(date.getDay() + 6) % 7]}</span>
      <span className="day__tags">
        {entries.map((entry) => (
          <TagChip
            key={entry.tag.id}
            entry={entry}
            iso={iso}
            readOnly={readOnly}
            variant={variant}
            wide={entries.length === 1}
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
  variant: 'year' | 'month'
  /** The day carries a single tag: the year bar then has room for the icon,
   *  the full name and the subtitle (two tags = acronym-only dot chip). */
  wide: boolean
  onOpen: (date: string, tagId: string) => void
  onRemove: (date: string, tagId: string) => void
}

/**
 * An applied tag inside a day. One click opens the detail modal (after
 * OPEN_DELAY so a double click can be told apart), double click or a
 * HOLD_DELAY press removes it from the day.
 */
function TagChip({ entry, iso, readOnly, variant, wide, onOpen, onRemove }: TagChipProps) {
  const { tag, subtitle } = entry
  const openTimer = useRef<number | null>(null)
  const holdTimer = useRef<number | null>(null)
  // Set by a long press, consumed by the click that follows the release.
  const suppressClick = useRef(false)
  // Where the press started, to tell a hold from a drag (month swipe).
  const origin = useRef<{ x: number; y: number } | null>(null)
  // Full label or acronym: the label is kept only while it fits.
  const chipRef = useRef<HTMLButtonElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)
  const [fits, setFits] = useState(true)

  useEffect(
    () => () => {
      if (openTimer.current !== null) window.clearTimeout(openTimer.current)
      if (holdTimer.current !== null) window.clearTimeout(holdTimer.current)
    },
    [],
  )

  /**
   * The full label stays on the chip only while it fits next to the icon;
   * when it does not, the acronym takes the line over (.tag-chip--abbrev).
   * The measurement must not depend on that decision — the hidden label
   * stays in the DOM at width 0, so its scrollWidth keeps reporting the
   * natural text width — or it would flip back and forth forever. A label
   * hidden by a media query (small cells) counts as "does not fit": those
   * rules want the acronym there anyway.
   */
  useLayoutEffect(() => {
    const chip = chipRef.current
    const label = labelRef.current
    if (!chip || !label) return
    const measure = () => {
      if (getComputedStyle(label).display === 'none') {
        setFits(false)
        return
      }
      const line = label.parentElement
      const icon = line?.querySelector<HTMLElement>('.tag-chip__icon') ?? null
      const iconWidth = icon?.offsetWidth ?? 0
      const lineGap = line ? parseFloat(getComputedStyle(line).columnGap) || 0 : 0
      const style = getComputedStyle(chip)
      const padding =
        (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0)
      // Room the label has: the whole line minus what the icon takes.
      const available = chip.clientWidth - padding - iconWidth - (iconWidth > 0 ? lineGap : 0)
      setFits(label.scrollWidth <= available + 1)
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(measure)
    observer.observe(chip)
    return () => observer.disconnect()
  })

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

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (readOnly) return
    suppressClick.current = false
    origin.current = { x: event.clientX, y: event.clientY }
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

  /** A drag (e.g. swiping to the next month) is not a hold: drop the timer. */
  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const start = origin.current
    if (!start || holdTimer.current === null) return
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) <= MOVE_TOLERANCE) return
    origin.current = null
    clearHoldTimer()
  }

  function handlePointerUp() {
    origin.current = null
    clearHoldTimer()
  }

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation()
    if (readOnly) return
    if (suppressClick.current) {
      suppressClick.current = false
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
    : `${tag.label}${subtitle ? ` — ${subtitle}` : ''}\nClic: detalle\nDoble clic: quitar`

  const acronym = tagAcronym(tag.label)
  // A year chip only has room for the icon and the subtitle when the day
  // carries a single tag; month chips always show them.
  const roomy = variant === 'month' || wide
  const icon = roomy ? tagIcon(tag) : ''
  const sub = subtitle && roomy ? `(${subtitle})` : null
  // The full label is the chip's text while it has room for it: the top
  // line of a month chip, and a single-tag year bar without subtitle (the
  // subtitle needs the room the name would take). Everything else — a year
  // bar with a subtitle, a two-tag dot — reads the acronym.
  const labelled = variant === 'month' || (wide && !sub)
  // The label is measured for real: too long → the acronym replaces it.
  const abbrev = labelled && !fits

  return (
    <button
      ref={chipRef}
      type="button"
      className={`tag-chip tag-chip--${variant}${abbrev ? ' tag-chip--abbrev' : ''}${readOnly ? '' : ' tag-chip--removable'}`}
      style={{ backgroundColor: tag.color, color: contrastOn(tag.color) }}
      title={title}
      disabled={readOnly}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      {/* Year chips are 12px-high bars: the full name when the day has a
          single tag and no subtitle, otherwise the acronym (plus the icon
          and the subtitle where a single tag leaves room for them). Month
          chips always start from the full name on their first line; the
          acronym takes over when the measurement says it does not fit —
          and small cells force it from their media queries. */}
      <span className="tag-chip__line">
        {icon ? <span className="tag-chip__icon">{icon}</span> : null}
        {labelled ? <span className="tag-chip__label" ref={labelRef}>{tag.label}</span> : null}
        {!labelled || !fits ? <span className="tag-chip__acro">{acronym}</span> : null}
      </span>
      {sub ? <span className="tag-chip__sub">{sub}</span> : null}
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
