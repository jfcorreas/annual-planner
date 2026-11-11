import type { Tag } from '../types'
import { tagIcon } from '../utils/tags'

interface TagPaletteProps {
  tags: Tag[]
  /** Tag selected to fill days with one click (null = none, days show detail). */
  activeTagId: string | null
  /** Selects a tag, or deselects it when it is already the active one. */
  onSelectTag: (tagId: string) => void
  onEditTags: () => void
  disabled: boolean
}

/** Palette of tags to fill the planner: select one, then click days. */
export function TagPalette({
  tags,
  activeTagId,
  onSelectTag,
  onEditTags,
  disabled,
}: TagPaletteProps) {
  return (
    <div className="palette" role="toolbar" aria-label="Etiquetas para rellenar">
      <span className="palette__label">
        {activeTagId
          ? 'Etiqueta activa: clic en un día para aplicarla · clic en la etiqueta = detalle · doble clic o mantener pulsado = quitarla'
          : 'Sin etiqueta activa: clic en un día para ver su detalle · elige una etiqueta para rellenar'}
      </span>
      <div className="palette__chips">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            className={`chip${activeTagId === tag.id ? ' chip--on' : ''}`}
            aria-pressed={activeTagId === tag.id}
            disabled={disabled}
            onClick={() => onSelectTag(tag.id)}
          >
            <span className="chip__dot" style={{ backgroundColor: tag.color }} />
            {tagIcon(tag)}
            {tag.label}
          </button>
        ))}
        <button type="button" className="chip chip--add" disabled={disabled} onClick={onEditTags}>
          ✏️ Etiquetas
        </button>
      </div>
    </div>
  )
}
