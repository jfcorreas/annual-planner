import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Tag } from '../types'
import { SUBTITLE_MAX_LENGTH } from '../types'
import { MONTH_NAMES } from '../utils/dates'

interface TagDetailModalProps {
  /** Tag applied on the day that was clicked. */
  tag: Tag
  /** ISO date (yyyy-MM-dd) of the application being inspected. */
  date: string
  /** Subtitle currently stored on this application (may be empty). */
  subtitle: string
  /** How many times the tag is applied in the year. */
  occurrences: number
  onSaveSubtitle: (subtitle: string) => void
  /** Remove the tag from this day. */
  onRemove: () => void
  onClose: () => void
}

/**
 * Little modal opened with one click on a day tag chip: shows every detail
 * of the application, lets the user edit its subtitle and remove it.
 * Removal by double-click / long-press happens on the chip itself.
 */
export function TagDetailModal({
  tag,
  date,
  subtitle,
  occurrences,
  onSaveSubtitle,
  onRemove,
  onClose,
}: TagDetailModalProps) {
  const [value, setValue] = useState(subtitle)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    onSaveSubtitle(value.trim().slice(0, SUBTITLE_MAX_LENGTH))
    onClose()
  }

  const canSave = value.trim() !== subtitle

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal--tag-detail"
        role="dialog"
        aria-modal="true"
        aria-label={`Detalle de la etiqueta ${tag.label}`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__head">
          <h2 className="tag-detail__title">
            <span className="stats__swatch" style={{ backgroundColor: tag.color }} />
            {tag.label}
          </h2>
          <button type="button" className="btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>

        <dl className="tag-detail__meta">
          <div className="tag-detail__row">
            <dt>Color</dt>
            <dd>{tag.color}</dd>
          </div>
          <div className="tag-detail__row">
            <dt>Fecha</dt>
            <dd>{formatIso(date)}</dd>
          </div>
          <div className="tag-detail__row">
            <dt>Aplicaciones</dt>
            <dd>
              {occurrences} {occurrences === 1 ? 'vez este año' : 'veces este año'}
            </dd>
          </div>
        </dl>

        <form className="tag-detail__form" onSubmit={handleSubmit}>
          <label className="field">
            <span>Subtítulo</span>
            <input
              type="text"
              value={value}
              maxLength={SUBTITLE_MAX_LENGTH}
              placeholder="Texto corto para este día (opcional)"
              onChange={(e) => setValue(e.target.value)}
              autoFocus
            />
          </label>
          <button type="submit" className="btn btn--primary" disabled={!canSave}>
            Guardar subtítulo
          </button>
        </form>

        <div className="tag-detail__actions">
          <button type="button" className="btn btn--danger" onClick={onRemove}>
            🗑️ Quitar del día
          </button>
        </div>
      </div>
    </div>
  )
}

/** "2026-01-05" -> "5 de enero de 2026" (ES/ES month names, no Date/DST). */
function formatIso(iso: string): string {
  const day = Number(iso.slice(8, 10))
  const month = Number(iso.slice(5, 7))
  const year = iso.slice(0, 4)
  const name = MONTH_NAMES[month - 1]
  if (!name || Number.isNaN(day)) return iso
  const lower = name.charAt(0).toLowerCase() + name.slice(1)
  return `${day} de ${lower} de ${year}`
}
