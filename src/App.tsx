import { useEffect, useMemo, useRef, useState } from 'react'
import type { Planner, PlannerStatus } from './types'
import { useAppData } from './hooks/useAppData'
import { exportToJson, importFromJson } from './storage'
import { daysOfMonth, daysOfYear, isoDate } from './utils/dates'
import { computeStats } from './utils/stats'
import { printPlanner } from './utils/print'
import { tagUsageAcrossPlanners } from './utils/tags'
import { TopBar } from './components/TopBar'
import { TagPalette } from './components/TagPalette'
import { YearView } from './components/YearView'
import { MonthZoom } from './components/MonthZoom'
import { StatsBar } from './components/StatsBar'
import { PlannersPanel } from './components/PlannersPanel'
import { TagsEditor } from './components/TagsEditor'
import { TagDetailModal } from './components/TagDetailModal'
import { DayDetailModal } from './components/DayDetailModal'
import type { DayEntry } from './components/DayCell'
import { AboutModal } from './components/AboutModal'

export default function App() {
  const store = useAppData()
  const planner = store.activePlanner

  const [activeTagId, setActiveTagId] = useState<string | null>(null)
  const [zoomMonth, setZoomMonth] = useState<number | null>(null)
  const [tagsOpen, setTagsOpen] = useState(false)
  const [tagDetail, setTagDetail] = useState<{ date: string; tagId: string } | null>(null)
  const [dayDetail, setDayDetail] = useState<string | null>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const readOnly = planner?.status === 'archivado'

  /* The active tag only while it still exists in the planner: no fallback. */
  const effectiveTagId =
    activeTagId && planner?.tags.some((t) => t.id === activeTagId) ? activeTagId : null

  /* Esc closes the month zoom, the tags editor, both detail modals and about. */
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return
      setZoomMonth(null)
      setTagsOpen(false)
      setTagDetail(null)
      setDayDetail(null)
      setAboutOpen(false)
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

  /** Days each tag of the active planner is applied on (global: every planner). */
  const tagUsage = useMemo(() => {
    const counts: Record<string, number> = {}
    if (!planner) return counts
    for (const entries of Object.values(planner.days)) {
      for (const entry of entries) counts[entry.tagId] = (counts[entry.tagId] ?? 0) + 1
    }
    // A global tag counts its applications in every planner.
    for (const tag of planner.tags) {
      if (tag.global) counts[tag.id] = tagUsageAcrossPlanners(store.planners, tag.id).days
    }
    return counts
  }, [planner, store.planners])
  const monthIso = useMemo(
    () =>
      planner && zoomMonth !== null ? daysOfMonth(planner.year, zoomMonth).map(isoDate) : [],
    [planner, zoomMonth],
  )

  /** Resolved entries (tag objects) of the day shown in the day detail modal. */
  const dayEntries = useMemo<DayEntry[]>(() => {
    if (!planner || !dayDetail) return []
    const entries: DayEntry[] = []
    for (const dayTag of planner.days[dayDetail] ?? []) {
      const tag = planner.tags.find((t) => t.id === dayTag.tagId)
      if (tag) entries.push({ tag, subtitle: dayTag.subtitle })
    }
    return entries
  }, [planner, dayDetail])

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

  /* Previous-version data: block everything until the user decides. */
  if (store.previousVersion) {
    return (
      <main className="app app--previous">
        <div className="previous-version" role="alert">
          <h1>⚠️ Versión anterior</h1>
          <p>
            Los datos guardados en este navegador son de una versión anterior del
            planificador y ya no son compatibles.
          </p>
          <p>Tus datos originales no se han modificado ni se han eliminado.</p>
          <button className="btn btn--primary" onClick={store.startFresh}>
            Empezar de cero
          </button>
        </div>
      </main>
    )
  }

  if (!planner || !yearStats) {
    return (
      <main className="app app--empty">
        <p>No hay ningún planificador.</p>
        <p>Crea uno nuevo en la sección “📋 Planificadores”.</p>
      </main>
    )
  }

  /* ---------------- detail modal data ---------------- */

  const detail = tagDetail
    ? (() => {
        const tag = planner.tags.find((t) => t.id === tagDetail.tagId)
        const entry = planner.days[tagDetail.date]?.find((e) => e.tagId === tagDetail.tagId)
        if (!tag || !entry) return null
        return { date: tagDetail.date, tagId: tagDetail.tagId, tag, subtitle: entry.subtitle ?? '' }
      })()
    : null
  const detailOccurrences = detail
    ? Object.values(planner.days).reduce(
        (total, entries) =>
          total + entries.filter((e) => e.tagId === detail.tagId).length,
        0,
      )
    : 0

  /* ---------------- day editing ---------------- */

  /** Click on a day's empty area: fill it with the active tag, or (when no
   *  tag is selected, or the planner is archived) show the day detail. */
  function handleDayClick(date: string) {
    if (readOnly || !effectiveTagId) {
      setDayDetail(date)
      return
    }
    const applied = store.toggleDayTag(planner!.id, date, effectiveTagId)
    if (!applied) setNotice(`Máximo 2 etiquetas por día (${date}). Quita una primero.`)
  }

  function handleTagOpen(date: string, tagId: string) {
    if (readOnly) return
    setTagDetail({ date, tagId })
  }

  /** Click on the day number: open the day detail modal (read-only safe). */
  function handleDayInfo(date: string) {
    setDayDetail(date)
  }

  function handleTagRemove(date: string, tagId: string) {
    if (readOnly) return
    store.removeDayTag(planner!.id, date, tagId)
    setTagDetail(null)
  }

  /* ---------------- tags ---------------- */

  function saveTag(
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
  ) {
    if (tagId) {
      const existing = planner!.tags.find((t) => t.id === tagId)
      // Unmarking a global tag is blocked while another planner uses it.
      if (existing?.global && !fields.global) {
        const others = tagUsageAcrossPlanners(store.planners, tagId, planner!.id)
        if (others.planners > 0) {
          setNotice(
            `🔒 “${existing.label}” se usa en otro planificador: quítala de sus días antes de hacerla local.`,
          )
          return
        }
      }
      store.updateTag(planner!.id, tagId, fields)
    } else
      store.addTag(
        planner!.id,
        fields.label,
        fields.color,
        fields.inStats,
        fields.holiday,
        fields.permit,
        fields.maxPerYear,
        fields.global,
      )
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
        setActiveTagId(null) // the import may switch the active planner
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
        onAbout={() => setAboutOpen(true)}
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
        onSelectTag={(id) => setActiveTagId((current) => (current === id ? null : id))}
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
          onDayInfo={handleDayInfo}
          onTagOpen={handleTagOpen}
          onTagRemove={handleTagRemove}
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
            onDayInfo={handleDayInfo}
            onTagOpen={handleTagOpen}
            onTagRemove={handleTagRemove}
            onClose={() => setZoomMonth(null)}
            onPrev={() => setZoomMonth((m) => (m ?? 0) - 1)}
            onNext={() => setZoomMonth((m) => (m ?? 0) + 1)}
          />
        )}
      </div>

      <PlannersPanel
        planners={store.planners}
        activePlannerId={store.activePlannerId}
        onSelect={(id) => {
          store.setActivePlannerId(id)
          setActiveTagId(null) // the tag selection belongs to one planner
          setZoomMonth(null)
          setTagDetail(null)
          setDayDetail(null)
        }}
        onCreate={(year) => {
          store.addPlanner(year)
          setActiveTagId(null)
          setZoomMonth(null)
          setTagDetail(null)
          setDayDetail(null)
          setNotice(`＋ Planificador ${year} creado.`)
        }}
        onToggleStatus={toggleStatus}
        onDelete={(id) => {
          store.removePlanner(id)
          setActiveTagId(null)
          setZoomMonth(null)
          setTagDetail(null)
          setDayDetail(null)
        }}
      />

      {tagsOpen && (
        <TagsEditor
          tags={planner.tags}
          usage={tagUsage}
          onSave={saveTag}
          onRemove={(tagId) => store.removeTag(planner.id, tagId)}
          onBlocked={(tagId) => {
            const tag = planner.tags.find((t) => t.id === tagId)
            if (!tag) return
            if (tag.global) {
              // Global: the toast shows the usage across every planner.
              const total = tagUsageAcrossPlanners(store.planners, tagId)
              setNotice(
                `🔒 “${tag.label}” se usa en ${total.days} ${total.days === 1 ? 'día' : 'días'} en ${total.planners} ${total.planners === 1 ? 'planificador' : 'planificadores'}: quítala de todos los días antes de eliminarla.`,
              )
              return
            }
            const count = tagUsage[tagId] ?? 0
            setNotice(
              `🔒 “${tag.label}” se usa en ${count} ${count === 1 ? 'día' : 'días'}: quítala de todos los días antes de eliminarla.`,
            )
          }}
          onClose={() => setTagsOpen(false)}
        />
      )}

      {detail && (
        <TagDetailModal
          tag={detail.tag}
          date={detail.date}
          subtitle={detail.subtitle}
          occurrences={detailOccurrences}
          onSaveSubtitle={(subtitle) =>
            store.setDayTagSubtitle(planner.id, detail.date, detail.tagId, subtitle)
          }
          onRemove={() => handleTagRemove(detail.date, detail.tagId)}
          onClose={() => setTagDetail(null)}
        />
      )}

      {dayDetail && (
        <DayDetailModal
          date={dayDetail}
          entries={dayEntries}
          onClose={() => setDayDetail(null)}
        />
      )}

      {aboutOpen && <AboutModal onClose={() => setAboutOpen(false)} />}

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}
    </div>
  )
}
