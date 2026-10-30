import { useCallback, useEffect, useMemo, useState } from 'react'
import type { AppData, DayTag, Planner, PlannerStatus, Tag } from '../types'
import { MAX_TAGS_PER_DAY, SUBTITLE_MAX_LENGTH } from '../types'
import { createPlanner } from '../defaults'
import { loadData, saveData } from '../storage'

const CURRENT_YEAR = new Date().getFullYear()

/** All app state: planners, active planner and their mutations. */
export function useAppData() {
  const [data, setData] = useState<AppData>(() => {
    const loaded = loadData()
    if (loaded && loaded.planners.length > 0) return loaded
    return { version: 1, planners: [createPlanner(CURRENT_YEAR)] }
  })
  const [activePlannerId, setActivePlannerId] = useState<string | null>(
    () => data.planners[0]?.id ?? null,
  )

  useEffect(() => {
    saveData(data)
  }, [data])

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

  const addPlanner = useCallback((year: number): Planner => {
    const planner = createPlanner(year)
    setData((prev) => ({ ...prev, planners: [...prev.planners, planner] }))
    setActivePlannerId(planner.id)
    return planner
  }, [])

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

  /** Clear every tag of a day. */
  const clearDay = useCallback(
    (plannerId: string, date: string) => {
      updatePlanner(plannerId, (planner) => {
        if (!planner.days[date]) return planner
        const days = { ...planner.days }
        delete days[date]
        return { ...planner, days }
      })
    },
    [updatePlanner],
  )

  /* ---------------- Tags ---------------- */

  const addTag = useCallback(
    (plannerId: string, label: string, color: string) => {
      const tag: Tag = { id: crypto.randomUUID(), label, color }
      updatePlanner(plannerId, (planner) => ({ ...planner, tags: [...planner.tags, tag] }))
      return tag
    },
    [updatePlanner],
  )

  const updateTag = useCallback(
    (plannerId: string, tagId: string, patch: Partial<Omit<Tag, 'id'>>) => {
      updatePlanner(plannerId, (planner) => ({
        ...planner,
        tags: planner.tags.map((t) => (t.id === tagId ? { ...t, ...patch } : t)),
      }))
    },
    [updatePlanner],
  )

  /** Delete a tag everywhere in the planner. */
  const removeTag = useCallback(
    (plannerId: string, tagId: string) => {
      updatePlanner(plannerId, (planner) => {
        const days: Record<string, DayTag[]> = {}
        for (const [date, entries] of Object.entries(planner.days)) {
          const rest = entries.filter((entry) => entry.tagId !== tagId)
          if (rest.length > 0) days[date] = rest
        }
        return { ...planner, tags: planner.tags.filter((t) => t.id !== tagId), days }
      })
    },
    [updatePlanner],
  )

  /**
   * Import planners (already validated by the caller): same id = update,
   * new id = append. Current planners not present in the import are kept.
   */
  const mergePlanners = useCallback(
    (imported: Planner[]) => {
      const byId = new Map(data.planners.map((p) => [p.id, p]))
      for (const planner of imported) byId.set(planner.id, planner)
      const merged = [...byId.values()]

      setData({ version: 1, planners: merged })
      if (activePlannerId !== null && merged.some((p) => p.id === activePlannerId)) return
      setActivePlannerId(merged[0]?.id ?? null)
    },
    [data.planners, activePlannerId],
  )

  return {
    planners: data.planners,
    activePlanner,
    activePlannerId: activePlanner?.id ?? null,
    setActivePlannerId,
    addPlanner,
    removePlanner,
    setPlannerStatus,
    toggleDayTag,
    removeDayTag,
    setDayTagSubtitle,
    clearDay,
    addTag,
    updateTag,
    removeTag,
    mergePlanners,
  }
}
