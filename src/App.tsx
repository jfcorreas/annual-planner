import { useEffect, useMemo, useRef, useState } from 'react'
import type { Planner, PlannerStatus, TagCategory } from './types'
import { useAppData } from './hooks/useAppData'
import { exportToJson, importFromJson } from './storage'
import { daysOfMonth, daysOfYear, isoDate } from './utils/dates'
import { computeStats } from './utils/stats'
import { printPlanner } from './utils/print'
import { TopBar } from './components/TopBar'
import { TagPalette } from './components/TagPalette'
import { YearView } from './components/YearView'
import { MonthZoom } from './components/MonthZoom'
import { StatsBar } from './components/StatsBar'
import { PlannersPanel } from './components/PlannersPanel'
import { TagsEditor } from './components/TagsEditor'

export default function App() {
  const store = useAppData()
  const planner = store.activePlanner

  const [activeTagId, setActiveTagId] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [zoomMonth, setZoomMonth] = useState<number | null>(null)
  const [tagsOpen, setTagsOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const readOnly = planner?.status === 'archivado'

  /* A valid tag for the current planner: the selection, else the first tag. */
  const effectiveTagId =
    activeTagId && planner?.tags.some((t) => t.id === activeTagId)
      ? activeTagId
      : (planner?.tags[0]?.id ?? null)

  /* Esc closes the month zoom and the tags editor. */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setZoomMonth(null)
      setTagsOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  /* Transient feedback (e.g. day already full). */
  useEffect(() => {
    if (!notice) return
    const timer = window.setTimeout(() => setNotice(null), 2600)
    return () => window.clearTimeout(timer)
  }, [notice])

  const yearIso = useMemo(
    () => (planner ? daysOfYear(planner.year).map(isoDate) : []),
    [planner],
  )
  const monthIso = useMemo(
    () =>
      planner && zoomMonth !== null ? daysOfMonth(planner.year, zoomMonth).map(isoDate) : [],
    [planner, zoomMonth],
  )

  const yearStats = useMemo(
    () => (planner ? computeStats(planner.days, planner.tags, yearIso) : null),
    [planner, yearIso],
  )
  const monthStats = useMemo(
    () =>
      planner && zoomMonth !== null
        ? computeStats(planner.days, planner.tags, monthIso)
        : null,
    [planner, zoomMonth, monthIso],
  )

  if (!planner || !yearStats) {
    return (
      <main className="app app--empty">
        <p>No hay ningún planificador.</p>
        <p>Crea uno nuevo en la sección “📋 Planificadores”.</p>
      </main>
    )
  }

  /* ---------------- day editing ---------------- */

  function handleDayClick(date: string) {
    if (readOnly) return
    if (clearing) {
      store.clearDay(planner!.id, date)
      return
    }
    if (!effectiveTagId) {
      setNotice('Selecciona una etiqueta primero.')
      return
    }
    const applied = store.toggleDayTag(planner!.id, date, effectiveTagId)
    if (!applied) setNotice(`Máximo 2 etiquetas por día (${date}). Quita una primero.`)
  }

  function handleTagClick(date: string, tagId: string) {
    if (readOnly) return
    // In clearing mode any click empties the day; otherwise the chip is removed.
    if (clearing) store.clearDay(planner!.id, date)
    else store.removeDayTag(planner!.id, date, tagId)
  }

  /* ---------------- tags ---------------- */

  function saveTag(label: string, category: TagCategory, color: string, tagId?: string) {
    if (tagId) store.updateTag(planner!.id, tagId, { label, category, color })
    else store.addTag(planner!.id, label, category, color)
  }

  /* ---------------- planners ---------------- */

  function toggleStatus(id: string, status: PlannerStatus) {
    store.setPlannerStatus(id, status)
    setNotice(status === 'archivado' ? '🔒 Planner archivado (solo lectura).' : '✏️ Planner reabierto.')
  }

  function deleteActivePlanner() {
    if (!window.confirm(`¿Eliminar el planificador ${planner!.year}? Esta acción no se puede deshacer.`)) {
      return
    }
    store.removePlanner(planner!.id)
    setZoomMonth(null)
  }

  /* ---------------- export / import ---------------- */

  function handleExport() {
    const json = exportToJson(store.planners)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'planificadores-annual-planner.json'
    anchor.click()
    URL.revokeObjectURL(url)
    setNotice(`📤 ${store.planners.length} planificador(es) exportado(s).`)
  }

  async function handleImportFile(file: File) {
    try {
      const imported: Planner[] = importFromJson(await file.text())
      const existingIds = new Set(store.planners.map((p) => p.id))
      const updates = imported.filter((p) => existingIds.has(p.id)).length
      const created = imported.length - updates
      const years = imported.map((p) => p.year).join(', ')
      const ok = window.confirm(
        `Se importarán ${imported.length} planificador(es) (${years}).\n\n` +
          `• ${created} nuevo(s) se añadirán.\n` +
          `• ${updates} actualizarán uno existente con el mismo identificador.\n` +
          `• El resto de tus planificadores actuales se conservan.\n\n¿Continuar?`,
      )
      if (ok) {
        store.mergePlanners(imported)
        setNotice(`📥 Importación completada (${imported.length} planificador(es)).`)
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Error desconocido al importar.')
    }
  }

  return (
    <div className="app">
      <TopBar
        planner={planner}
        onToggleStatus={() => toggleStatus(planner.id, planner.status === 'activo' ? 'archivado' : 'activo')}
        onExport={handleExport}
        onImport={() => fileInputRef.current?.click()}
        onPrint={printPlanner}
        onDelete={deleteActivePlanner}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="visually-hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void handleImportFile(file)
          e.target.value = '' // allow re-importing the same file
        }}
      />

      <TagPalette
        tags={planner.tags}
        activeTagId={effectiveTagId}
        onSelectTag={(id) => {
          setActiveTagId(id)
          setClearing(false)
        }}
        clearing={clearing}
        onToggleClearing={() => setClearing((c) => !c)}
        onEditTags={() => setTagsOpen(true)}
        disabled={Boolean(readOnly)}
      />

      <div className="planner">
        <YearView
          year={planner.year}
          daysData={planner.days}
          tags={planner.tags}
          readOnly={Boolean(readOnly)}
          onDayClick={handleDayClick}
          onTagClick={handleTagClick}
          onZoom={setZoomMonth}
        />
        <StatsBar stats={yearStats} year={planner.year} />

        {zoomMonth !== null && monthStats && (
          <MonthZoom
            year={planner.year}
            month={zoomMonth}
            daysData={planner.days}
            tags={planner.tags}
            readOnly={Boolean(readOnly)}
            stats={monthStats}
            onDayClick={handleDayClick}
            onTagClick={handleTagClick}
            onClose={() => setZoomMonth(null)}
          />
        )}
      </div>

      <PlannersPanel
        planners={store.planners}
        activePlannerId={store.activePlannerId}
        onSelect={(id) => {
          store.setActivePlannerId(id)
          setZoomMonth(null)
        }}
        onCreate={(year) => {
          store.addPlanner(year)
          setZoomMonth(null)
          setNotice(`＋ Planificador ${year} creado.`)
        }}
        onToggleStatus={toggleStatus}
        onDelete={(id) => {
          store.removePlanner(id)
          setZoomMonth(null)
        }}
      />

      {tagsOpen && (
        <TagsEditor
          tags={planner.tags}
          onSave={saveTag}
          onRemove={(tagId) => store.removeTag(planner.id, tagId)}
          onClose={() => setTagsOpen(false)}
        />
      )}

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </div>
  )
}
