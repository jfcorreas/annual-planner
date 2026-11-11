import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppData, DayTag, Planner, PlannerStatus, Tag } from '../types'
import { MAX_TAGS_PER_DAY, SUBTITLE_MAX_LENGTH } from '../types'
import { createPlanner, newId } from '../defaults'
import { hasPreviousVersionData, loadData, saveData } from '../storage'

const CURRENT_YEAR = new Date().getFullYear()

/** All app state: planners, active planner and their mutations. */
export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    const loaded = loadData()
    if (loaded && loaded.planners.length > 0) return loaded
    return { version: 2, planners: [createPlanner(CURRENT_YEAR)] }
  })
  const [activePlannerId, setActivePlannerId] = useState<string | null>(
    () => data.planners[0]?.id ?? null,
  )

  /**
   * Previous-version data exists and there is no valid current data yet:
   * the app must wait for an explicit confirmation before writing anything.
   */
  const [previousVersion, setPreviousVersion] = useState(
    () => loadData() === null && hasPreviousVersionData(),
  )

  useEffect(() => {
    if (previousVersion) return
    saveData(data)
  }, [data, previousVersion])

  const activePlanner = useMemo(
    () => data.planners.find((p) => p.id === activePlannerId) ?? data.planners[0] ?? null,
    [data.planners, activePlannerId],
  )

  /** Replace one planner, keeping the rest untouched. */
  const updatePlanner = useCallback(
    (id: string, mutate: (planner: Planner) => Planner) => {
      setData((prev) => ({
        ...prev,
        planners: prev.planners.map((p) => (p.id === id ? mutate(p) : p)),
      }))
    },
    [],
  )

  const addPlanner = useCallback(
    (year: number): Planner => {
      // New planners start with the defaults plus the current global tags.
      const globals = data.planners.flatMap((p) => p.tags.filter((t) => t.global === true))
      const planner = createPlanner(year, globals)
      setData((prev) => ({ ...prev, planners: [...prev.planners, planner] }))
      setActivePlannerId(planner.id)
      return planner
    },
    [data.planners],
  )

  const removePlanner = useCallback(
    (id: string) => {
      const remaining = data.planners.filter((p) => p.id !== id)
      setData((prev) => ({ ...prev, planners: prev.planners.filter((p) => p.id !== id) }))
      if (activePlannerId === id) setActivePlannerId(remaining[0]?.id ?? null)
    },
    [data.planners, activePlannerId],
  )

  const setPlannerStatus = useCallback(
    (id: string, status: PlannerStatus) => updatePlanner(id, (p) => ({ ...p, status })),
    [updatePlanner],
  )

  /**
   * Toggle the given tag on a day: adds it when there is room (or when it
   * is already there, removes it). Returns false when the day is full and
   * the tag is not applied yet. Decided from the current state, not from
   * inside the state updater, so the answer is reliable.
   */
  const toggleDayTag = useCallback(
    (plannerId: string, date: string, tagId: string): boolean => {
      const planner = data.planners.find((p) => p.id === plannerId)
      if (!planner) return false
      const current = planner.days[date] ?? []

      if (current.some((entry) => entry.tagId === tagId)) {
        const rest = current.filter((entry) => entry.tagId !== tagId)
        setData((prev) => ({
          ...prev,
          planners: prev.planners.map((p) =>
            p.id === plannerId ? { ...p, days: { ...p.days, [date]: rest } } : p,
          ),
        }))
        return true
      }
      if (current.length >= MAX_TAGS_PER_DAY) return false

      const next = [...current, { tagId }]
      setData((prev) => ({
        ...prev,
        planners: prev.planners.map((p) =>
          p.id === plannerId ? { ...p, days: { ...p.days, [date]: next } } : p,
        ),
      }))
      return true
    },
    [data.planners],
  )

  /** Remove one tag from a day (double-click / long-press on the chip). */
  const removeDayTag = useCallback(
    (plannerId: string, date: string, tagId: string) => {
      updatePlanner(plannerId, (planner) => {
        const rest = (planner.days[date] ?? []).filter((entry) => entry.tagId !== tagId)
        return { ...planner, days: { ...planner.days, [date]: rest } }
      })
    },
    [updatePlanner],
  )

  /**
   * Set (or clear with an empty string) the subtitle of one tag application.
   * The subtitle belongs to the (date, tagId) pair, not to the tag itself.
   */
  const setDayTagSubtitle = useCallback(
    (plannerId: string, date: string, tagId: string, subtitle: string) => {
      const trimmed = subtitle.trim().slice(0, SUBTITLE_MAX_LENGTH)
      updatePlanner(plannerId, (planner) => {
        const entries = planner.days[date]
        if (!entries) return planner
        const next = entries.map((entry) => {
          if (entry.tagId !== tagId) return entry
          return trimmed ? { ...entry, subtitle: trimmed } : { tagId: entry.tagId }
        })
        return { ...planner, days: { ...planner.days, [date]: next } }
      })
    },
    [updatePlanner],
  )

  /* ---------------- Tags ---------------- */

  const addTag = useCallback(
    (
      plannerId: string,
      label: string,
      color: string,
      inStats = true,
      holiday = false,
      permit = false,
      maxPerYear?: number,
      global = false,
    ) => {
      const tag: Tag = { id: newId(), label, color, inStats, holiday }
      if (global) tag.global = true
      if (permit) {
        tag.permit = true
        tag.maxPerYear = maxPerYear
      }
      // A global tag is created in every planner at once (fresh id: no clashes).
      if (global) {
        setData((prev) => ({
          ...prev,
          planners: prev.planners.map((p) => ({ ...p, tags: [...p.tags, tag] })),
        }))
        return tag
      }
      updatePlanner(plannerId, (planner) => ({ ...planner, tags: [...planner.tags, tag] }))
      return tag
    },
    [updatePlanner],
  )

  const updateTag = useCallback(
    (plannerId: string, tagId: string, patch: Partial<Omit<Tag, 'id'>>) => {
      setData((prev) => {
        const base = prev.planners.find((p) => p.id === plannerId)?.tags.find((t) => t.id === tagId)
        if (!base) return prev
        const updated: Tag = { ...base, ...patch }

        // A global tag writes the merged tag into every planner, appending
        // a copy to the ones that do not have it yet.
        if (updated.global) {
          return {
            ...prev,
            planners: prev.planners.map((p) =>
              p.tags.some((t) => t.id === tagId)
                ? { ...p, tags: p.tags.map((t) => (t.id === tagId ? updated : t)) }
                : { ...p, tags: [...p.tags, updated] },
            ),
          }
        }
        // Unmarking (only from global) clears the flag in every planner;
        // each keeps its copy. A local tag stays a per-planner edit.
        if (base.global === true && patch.global === false) {
          return {
            ...prev,
            planners: prev.planners.map((p) => ({
              ...p,
              tags: p.tags.map((t) => (t.id === tagId ? { ...t, ...patch } : t)),
            })),
          }
        }
        return {
          ...prev,
          planners: prev.planners.map((p) =>
            p.id === plannerId ? { ...p, tags: p.tags.map((t) => (t.id === tagId ? updated : t)) } : p,
          ),
        }
      })
    },
    [],
  )

  /** Delete a tag everywhere in the planner (from every planner if global). */
  const removeTag = useCallback((plannerId: string, tagId: string) => {
    const strip = (planner: Planner): Planner => {
      const days: Record<string, DayTag[]> = {}
      for (const [date, entries] of Object.entries(planner.days)) {
        const rest = entries.filter((entry) => entry.tagId !== tagId)
        if (rest.length > 0) days[date] = rest
      }
      return { ...planner, tags: planner.tags.filter((t) => t.id !== tagId), days }
    }

    setData((prev) => {
      const source = prev.planners.find((p) => p.id === plannerId)
      if (!source) return prev
      const isGlobal = source.tags.find((t) => t.id === tagId)?.global === true
      return {
        ...prev,
        planners: prev.planners.map((p) => (isGlobal || p.id === plannerId ? strip(p) : p)),
      }
    })
  }, [])

  /**
   * Import planners (already validated by the caller): same id = update,
   * new id = append. Current planners not present in the import are kept.
   */
  const mergePlanners = useCallback(
    (imported: Planner[]) => {
      const byId = new Map(data.planners.map((p) => [p.id, p]))
      for (const planner of imported) byId.set(planner.id, planner)
      const merged = [...byId.values()]

      setData({ version: 2, planners: merged })
      if (activePlannerId !== null && merged.some((p) => p.id === activePlannerId)) return
      setActivePlannerId(merged[0]?.id ?? null)
    },
    [data.planners, activePlannerId],
  )

  /**
   * Confirm the "previous version" notice: drop the pending state and start
   * over with a fresh default planner (the save effect then persists it).
   */
  const startFresh = useCallback(() => {
    setPreviousVersion(false)
    setData({ version: 2, planners: [createPlanner(CURRENT_YEAR)] })
  }, [])

  return {
    planners: data.planners,
    previousVersion,
    startFresh,
    activePlanner,
    activePlannerId: activePlanner?.id ?? null,
    setActivePlannerId,
    addPlanner,
    removePlanner,
    setPlannerStatus,
    toggleDayTag,
    removeDayTag,
    setDayTagSubtitle,
    addTag,
    updateTag,
    removeTag,
    mergePlanners,
  }
}
