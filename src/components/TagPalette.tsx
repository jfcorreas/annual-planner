import type { Tag } from '../types'

interface TagPaletteProps {
  tags: Tag[]
  /** Tag selected to fill days with one click. */
  activeTagId: string | null
  onSelectTag: (tagId: string) => void
  /** When true, clicking a day clears it instead of filling it. */
  clearing: boolean
  onToggleClearing: () => void
  onEditTags: () => void
  disabled: boolean
}

/** Palette of tags to fill the planner: select one, then click days. */
export function TagPalette({
  tags,
  activeTagId,
  onSelectTag,
  clearing,
  onToggleClearing,
  onEditTags,
  disabled,
}: TagPaletteProps) {
  return (
    <div className="palette" role="toolbar" aria-label="Etiquetas para rellenar">
      <span className="palette__label">
        {clearing
          ? 'Modo limpiar: clic en un día para vaciarlo'
          : 'Etiqueta activa: clic en un día para aplicarla · clic en la etiqueta del día para quitarla'}
      </span>
      <div className="palette__chips">
        {tags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            className={`chip${!clearing && activeTagId === tag.id ? ' chip--on' : ''}`}
            aria-pressed={!clearing && activeTagId === tag.id}
            disabled={disabled}
            onClick={() => onSelectTag(tag.id)}
          >
            <span className="chip__dot" style={{ backgroundColor: tag.color }} />
            {tag.label}
          </button>
        ))}
        <button type="button" className="chip chip--add" disabled={disabled} onClick={onEditTags}>
          ＋ Etiquetas
        </button>
      </div>
      <span className="spacer" />
      <button
        type="button"
        className={`chip chip--clear${clearing ? ' chip--on' : ''}`}
        aria-pressed={clearing}
        disabled={disabled}
        onClick={onToggleClearing}
      >
        🧽 Limpiar día
      </button>
    </div>
  )
}
