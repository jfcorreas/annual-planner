import { addDays, eachDayOfInterval, endOfMonth, getDay, startOfMonth } from 'date-fns'

/** Spanish month names (ES/ES), index 0 = Enero. */
export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const

/** Short weekday initials, index 0 = Monday (L M X J V S D). */
export const WEEKDAY_INITIALS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const

/** Full weekday names, index 0 = Monday. */
export const WEEKDAY_NAMES = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo',
] as const

/** ISO date key used in Planner.days (yyyy-MM-dd). */
export function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/** Weekday index with Monday = 0. */
export function mondayIndex(date: Date): number {
  return (getDay(date) + 6) % 7
}

export function isWeekend(date: Date): boolean {
  return mondayIndex(date) >= 5
}

/** Every day of the given year. */
export function daysOfYear(year: number): Date[] {
  return eachDayOfInterval({ start: new Date(year, 0, 1), end: new Date(year, 11, 31) })
}

/** Every day of a month (0-11). */
export function daysOfMonth(year: number, month: number): Date[] {
  const start = startOfMonth(new Date(year, month, 1))
  return eachDayOfInterval({ start, end: endOfMonth(start) })
}

/**
 * Days grouped in Monday-first weeks: 7 slots per week,
 * `null` for days outside the month (leading/trailing blanks).
 */
export function weeksOfMonth(year: number, month: number): (Date | null)[][] {
  const days = daysOfMonth(year, month)
  const weeks: (Date | null)[][] = []
  let week: (Date | null)[] = Array.from({ length: mondayIndex(days[0]) }, () => null)

  for (const day of days) {
    week.push(day)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) weeks.push(week.concat(Array.from({ length: 7 - week.length }, () => null)))
  return weeks
}

/** Days of the year grouped in Monday-first weeks (for the year view). */
export function weeksOfYear(year: number): (Date | null)[][] {
  const weeks: (Date | null)[][] = []
  let week: (Date | null)[] = Array.from({ length: mondayIndex(new Date(year, 0, 1)) }, () => null)

  for (const day of daysOfYear(year)) {
    week.push(day)
    if (week.length === 7) {
      weeks.push(week)
      week = []
    }
  }
  if (week.length > 0) weeks.push(week.concat(Array.from({ length: 7 - week.length }, () => null)))
  return weeks
}

/** Add n days to a date (re-exported for convenience in components). */
export { addDays }
