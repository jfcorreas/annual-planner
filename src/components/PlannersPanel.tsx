import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Planner, PlannerStatus } from '../types'

const CURRENT_YEAR = new Date().getFullYear()

interface PlannersPanelProps {
  planners: Planner[]
  activePlannerId: string | null
  onSelect: (id: string) => void
  onCreate: (year: number) => void
  onToggleStatus: (id: string, status: PlannerStatus) => void
  onDelete: (id: string) => void
}

/** List of every planner: open, archive/reopen and delete. */
export function PlannersPanel({
  planners,
  activePlannerId,
  onSelect,
  onCreate,
  onToggleStatus,
  onDelete,
}: PlannersPanelProps) {
  const nextYear = Math.max(...planners.map((p) => p.year), CURRENT_YEAR - 1) + 1
  const [year, setYear] = useState(String(nextYear))
  const [open, setOpen] = useState(false)

  function handleCreate(event: FormEvent) {
    event.preventDefault()
    const value = Number(year)
    if (!Number.isInteger(value) || value < 1900 || value > 2200) return
    onCreate(value)
    setOpen(false)
    setYear(String(value + 1))
  }

  return (
    <section className="panel" aria-label="Todos los planificadores">
      <h3 className="panel__title">📋 Planificadores</h3>
      <ul className="panel__list">
        {planners.map((planner) => (
          <li
            key={planner.id}
            className={`panel__item${planner.id === activePlannerId ? ' panel__item--current' : ''}`}
          >
            <button
              type="button"
              className="panel__year"
              onClick={() => onSelect(planner.id)}
              title={`Abrir ${planner.name}`}
            >
              {planner.year}
            </button>
            <span className={`status status--${planner.status}`}>
              {planner.status === 'archivado' ? '🔒 Archivado' : '● Activo'}
            </span>
            <span className="spacer" />
            <button
              type="button"
              className="btn"
              onClick={() =>
                onToggleStatus(planner.id, planner.status === 'activo' ? 'archivado' : 'activo')
              }
            >
              {planner.status === 'activo' ? '🗂️ Archivar' : '🔓 Reabrir'}
            </button>
            <button
              type="button"
              className="btn btn--danger"
              title="Eliminar planificador"
              onClick={() => {
                if (window.confirm(`¿Eliminar el planificador ${planner.year}? Esta acción no se puede deshacer.`)) {
                  onDelete(planner.id)
                }
              }}
            >
              🗑️
            </button>
          </li>
        ))}
      </ul>

      {open ? (
        <form className="panel__create" onSubmit={handleCreate}>
          <label className="field field--inline">
            <span>Año</span>
            <input
              type="number"
              min={1900}
              max={2200}
              value={year}
              onChange={(e) => setYear(e.target.value)}
              autoFocus
            />
          </label>
          <button type="submit" className="btn btn--primary">Crear</button>
          <button type="button" className="btn" onClick={() => setOpen(false)}>Cancelar</button>
        </form>
      ) : (
        <button type="button" className="btn btn--primary panel__new" onClick={() => setOpen(true)}>
          ＋ Nuevo planificador (año)
        </button>
      )}
    </section>
  )
}
