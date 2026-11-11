import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Tag } from '../types'
import { tagIcon } from '../utils/tags'

interface TagsEditorProps {
  tags: Tag[]
  /** Days each tag is applied on (usage count per tag id). */
  usage: Record<string, number>
  onSave: (
    fields: {
      label: string
      color: string
      inStats: boolean
      holiday: boolean
      permit: boolean
      maxPerYear?: number
      global: boolean
    },
    tagId?: string,
  ) => void
  onRemove: (tagId: string) => void
  /** Called instead of removing when the tag is applied on at least one day. */
  onBlocked: (tagId: string) => void
  onClose: () => void
}

const COLOR_SWATCHES = [
  '#facc15', '#a16207', '#2f6fed', '#7c5ce0', '#e01b24',
  '#86efac', '#3fae6b', '#15803d', '#0891b2', '#db2777',
  '#f97316', '#64748b',
]

/** Modal to create, rename, recolor and delete tags. */
export function TagsEditor({ tags, usage, onSave, onRemove, onBlocked, onClose }: TagsEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [color, setColor] = useState(COLOR_SWATCHES[0])
  const [inStats, setInStats] = useState(true)
  const [holiday, setHoliday] = useState(false)
  const [permit, setPermit] = useState(false)
  const [maxPerYear, setMaxPerYear] = useState('')
  const [global, setGlobal] = useState(false)

  function startEdit(tag: Tag) {
    setEditingId(tag.id)
    setLabel(tag.label)
    setColor(tag.color)
    setInStats(tag.inStats !== false)
    setHoliday(tag.holiday === true)
    setPermit(tag.permit === true)
    setMaxPerYear(tag.maxPerYear !== undefined ? String(tag.maxPerYear) : '')
    setGlobal(tag.global === true)
  }

  function startNew() {
    setEditingId(null)
    setLabel('')
    setColor(COLOR_SWATCHES[0])
    setInStats(true)
    setHoliday(false)
    setPermit(false)
    setMaxPerYear('')
    setGlobal(false)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = label.trim()
    if (!trimmed) return
    onSave(
      {
        label: trimmed,
        color,
        inStats,
        holiday,
        permit,
        maxPerYear: permit ? Number(maxPerYear) : undefined,
        global,
      },
      editingId ?? undefined,
    )
    startNew()
  }

  const canSubmit =
    label.trim().length > 0 &&
    (!permit || (Number.isInteger(Number(maxPerYear)) && Number(maxPerYear) >= 1))

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal--tags"
        role="dialog"
        aria-modal="true"
        aria-label="Editor de etiquetas"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__head">
          <h2>🏷️ Etiquetas</h2>
          <button type="button" className="btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>

        {/* Only this list scrolls: the header and the form below stay pinned. */}
        <ul className="tags-list">
          {tags.map((tag) => (
            <li
              key={tag.id}
              className="tags-list__item"
              style={{ borderLeftColor: tag.color }}
            >
              <span className="tags-list__label" title={tag.label}>
                {tagIcon(tag, { showGlobal: true })}
                {tag.label}
              </span>
              <div className="tags-list__actions">
                <button
                  type="button"
                  className="btn btn--icon"
                  aria-label={`Editar ${tag.label}`}
                  title="Editar etiqueta"
                  onClick={() => startEdit(tag)}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="btn btn--icon"
                  aria-label={`Eliminar ${tag.label}`}
                  title="Eliminar etiqueta (se quita de todos los días)"
                  onClick={() => {
                    if ((usage[tag.id] ?? 0) > 0) {
                      onBlocked(tag.id)
                      return
                    }
                    if (window.confirm(`¿Eliminar la etiqueta “${tag.label}”?`)) {
                      onRemove(tag.id)
                      if (editingId === tag.id) startNew()
                    }
                  }}
                >
                  🗑️
                </button>
              </div>
            </li>
          ))}
        </ul>

        <form className="tag-form" onSubmit={handleSubmit}>
          <h3>{editingId ? '✏️ Editar etiqueta' : '＋ Nueva etiqueta'}</h3>
          <label className="field">
            <span>Nombre</span>
            <input
              type="text"
              value={label}
              maxLength={40}
              placeholder="Ej. Guardia 24h"
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
          </label>
          <fieldset className="field field--colors">
            <legend>Color</legend>
            <div className="color-swatches">
              {COLOR_SWATCHES.map((swatch) => (
                <button
                  key={swatch}
                  type="button"
                  className={`color-swatch${color === swatch ? ' color-swatch--on' : ''}`}
                  style={{ backgroundColor: swatch }}
                  aria-label={`Color ${swatch}`}
                  onClick={() => setColor(swatch)}
                />
              ))}
              <input
                type="color"
                value={color}
                aria-label="Color personalizado"
                onChange={(e) => setColor(e.target.value)}
              />
            </div>
          </fieldset>
          <label className="field field--inline">
            <span>Incluir en estadísticas</span>
            <input
              type="checkbox"
              checked={inStats}
              disabled={holiday || permit}
              onChange={(e) => setInStats(e.target.checked)}
            />
          </label>
          <label className="field field--inline">
            <span>Día Festivo</span>
            <input
              type="checkbox"
              checked={holiday}
              onChange={(e) => {
                setHoliday(e.target.checked)
                if (e.target.checked) {
                  setInStats(false)
                  setPermit(false)
                }
              }}
            />
          </label>
          <div className="field field--permit">
            <label className="field field--inline">
              <span>Permiso de trabajo</span>
              <input
                type="checkbox"
                checked={permit}
                onChange={(e) => {
                  setPermit(e.target.checked)
                  if (e.target.checked) {
                    setHoliday(false)
                    setInStats(true)
                  }
                }}
              />
            </label>
            {permit && (
              <label className="field field--inline">
                <span>Máximo por año</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={maxPerYear}
                  onChange={(e) => setMaxPerYear(e.target.value)}
                />
              </label>
            )}
          </div>
          <label className="field field--inline">
            <span>Global</span>
            <input
              type="checkbox"
              checked={global}
              onChange={(e) => setGlobal(e.target.checked)}
            />
          </label>
          <div className="tag-form__actions">
            {editingId && (
              <button type="button" className="btn" onClick={startNew}>
                Cancelar edición
              </button>
            )}
            <button type="submit" className="btn btn--primary" disabled={!canSubmit}>
              {editingId ? 'Guardar cambios' : '＋ Crear etiqueta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
