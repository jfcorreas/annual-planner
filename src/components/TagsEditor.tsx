import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Tag, TagType } from '../types'
import { NO_TYPE_LABEL, tagTypeLabel } from '../types'

interface TagsEditorProps {
  tags: Tag[]
  /** User-managed types of this planner (CRUD below). */
  tagTypes: TagType[]
  onSave: (label: string, category: string, color: string, tagId?: string) => void
  onRemove: (tagId: string) => void
  /** Create a type; the label is trimmed upstream (empty = ignored). */
  onAddType: (label: string) => void
  onRenameType: (typeId: string, label: string) => void
  /** Delete a type; blocked with a notice when tags still use it. */
  onRemoveType: (typeId: string) => void
  onClose: () => void
}

const COLOR_SWATCHES = [
  '#facc15', '#a16207', '#2f6fed', '#7c5ce0', '#e01b24',
  '#86efac', '#3fae6b', '#15803d', '#0891b2', '#db2777',
  '#f97316', '#64748b',
]

/** Modal to create, rename, recolor and delete tags and manage tag types. */
export function TagsEditor({
  tags,
  tagTypes,
  onSave,
  onRemove,
  onAddType,
  onRenameType,
  onRemoveType,
  onClose,
}: TagsEditorProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [label, setLabel] = useState('')
  const [category, setCategory] = useState<string>('trabajo')
  const [color, setColor] = useState(COLOR_SWATCHES[0])

  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [typeName, setTypeName] = useState('')

  function startEdit(tag: Tag) {
    setEditingId(tag.id)
    setLabel(tag.label)
    setCategory(tag.category)
    setColor(tag.color)
  }

  function startNew() {
    setEditingId(null)
    setLabel('')
    setCategory('trabajo')
    setColor(COLOR_SWATCHES[0])
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = label.trim()
    if (!trimmed) return
    onSave(trimmed, category, color, editingId ?? undefined)
    startNew()
  }

  function startEditType(type: TagType) {
    setEditingTypeId(type.id)
    setTypeName(type.label)
  }

  function cancelEditType() {
    setEditingTypeId(null)
    setTypeName('')
  }

  function handleTypeSubmit(event: FormEvent) {
    event.preventDefault()
    const trimmed = typeName.trim()
    if (!trimmed) return
    if (editingTypeId) onRenameType(editingTypeId, trimmed)
    else onAddType(trimmed)
    cancelEditType()
  }

  function handleRemoveType(type: TagType) {
    if (window.confirm(`¿Eliminar el tipo “${type.label}”?`)) {
      onRemoveType(type.id)
      if (editingTypeId === type.id) cancelEditType()
    }
  }

  const canSubmit = label.trim().length > 0
  // A tag can point to a type that was imported from elsewhere: show it as-is.
  const categoryKnown = tagTypes.some((t) => t.id === category)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
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

        <ul className="tags-list">
          {tags.map((tag) => (
            <li key={tag.id} className="tags-list__item">
              <span className="stats__swatch" style={{ backgroundColor: tag.color }} />
              <span className="tags-list__label">{tag.label}</span>
              <span className="tags-list__cat">{tagTypeLabel(tagTypes, tag.category)}</span>
              <button type="button" className="btn" onClick={() => startEdit(tag)}>
                ✏️
              </button>
              <button
                type="button"
                className="btn"
                title="Eliminar etiqueta (se quita de todos los días)"
                onClick={() => {
                  if (window.confirm(`¿Eliminar la etiqueta “${tag.label}”? Se quitará de todos los días.`)) {
                    onRemove(tag.id)
                    if (editingId === tag.id) startNew()
                  }
                }}
              >
                🗑️
              </button>
            </li>
          ))}
        </ul>

        <section className="types-editor">
          <h3>🗂️ Tipos de etiqueta</h3>
          <ul className="types-list">
            {tagTypes.map((type) => (
              <li key={type.id} className="types-list__item">
                <span className="types-list__label">{type.label}</span>
                <span className="types-list__count">
                  {tags.filter((t) => t.category === type.id).length} etiqueta(s)
                </span>
                <button
                  type="button"
                  className="btn"
                  aria-label={`Renombrar tipo ${type.label}`}
                  onClick={() => startEditType(type)}
                >
                  ✏️
                </button>
                <button
                  type="button"
                  className="btn"
                  aria-label={`Eliminar tipo ${type.label}`}
                  title="Eliminar tipo (bloqueado si lo usan etiquetas)"
                  onClick={() => handleRemoveType(type)}
                >
                  🗑️
                </button>
              </li>
            ))}
          </ul>
          <form className="types-editor__form" onSubmit={handleTypeSubmit}>
            <label className="field">
              <span>{editingTypeId ? 'Renombrar tipo' : 'Nuevo tipo'}</span>
              <input
                type="text"
                value={typeName}
                maxLength={40}
                placeholder="Ej. Comunidad"
                onChange={(e) => setTypeName(e.target.value)}
              />
            </label>
            <div className="tag-form__actions">
              {editingTypeId && (
                <button type="button" className="btn" onClick={cancelEditType}>
                  Cancelar
                </button>
              )}
              <button
                type="submit"
                className="btn btn--primary"
                disabled={typeName.trim().length === 0}
              >
                {editingTypeId ? 'Guardar tipo' : '＋ Añadir tipo'}
              </button>
            </div>
          </form>
        </section>

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
          <label className="field">
            <span>Tipo</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {!categoryKnown && <option value={category}>{NO_TYPE_LABEL}</option>}
              {tagTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.label}
                </option>
              ))}
            </select>
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
