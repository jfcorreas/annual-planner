import type { Planner } from '../types'

interface TopBarProps {
  planner: Planner
  onToggleStatus: () => void
  onExport: () => void
  onImport: () => void
  onPrint: (paper: 'A4' | 'A5') => void
  onDelete: () => void
}

/** Title, status toggle and global actions of the current planner. */
export function TopBar({
  planner,
  onToggleStatus,
  onExport,
  onImport,
  onPrint,
  onDelete,
}: TopBarProps) {
  const archived = planner.status === 'archivado'

  return (
    <header className="topbar">
      <span className="topbar__icon" aria-hidden="true">📅</span>
      <h1 className="topbar__title">{planner.name}</h1>
      <button
        type="button"
        className={`status status--${planner.status}`}
        onClick={onToggleStatus}
        title={archived ? 'Reabrir: vuelve a permitir edición' : 'Archivar: pasa a solo lectura'}
      >
        {archived ? '🔒 Archivado' : '● Activo'}
        <span className="status__action">{archived ? ' — reabrir' : ' — archivar'}</span>
      </button>

      <span className="spacer" />

      <nav className="topbar__actions" aria-label="Acciones">
        <button type="button" className="btn" onClick={onImport} title="Importar planificadores desde un archivo JSON">
          📥 Importar
        </button>
        <button type="button" className="btn" onClick={onExport} title="Exportar todos los planificadores a un archivo JSON">
          📤 Exportar
        </button>
        <button type="button" className="btn" onClick={() => onPrint('A4')} title="Exportar a PDF en A4 horizontal">
          🖨️ PDF A4
        </button>
        <button type="button" className="btn" onClick={() => onPrint('A5')} title="Exportar a PDF en A5 horizontal">
          🖨️ PDF A5
        </button>
        <button
          type="button"
          className="btn btn--danger"
          onClick={onDelete}
          title="Eliminar este planificador"
        >
          🗑️
        </button>
      </nav>
    </header>
  )
}
