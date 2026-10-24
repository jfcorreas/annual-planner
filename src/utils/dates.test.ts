import { describe, expect, it } from 'vitest'
import {
  MONTH_NAMES,
  WEEKDAY_INITIALS,
  WEEKDAY_NAMES,
  daysOfMonth,
  daysOfYear,
  isWeekend,
  mondayIndex,
  weeksOfMonth,
  weeksOfYear,
  isoDate,
} from './dates'

describe('ES/ES names', () => {
  it('has the 12 Spanish month names', () => {
    expect(MONTH_NAMES).toHaveLength(12)
    expect(MONTH_NAMES[0]).toBe('Enero')
    expect(MONTH_NAMES[11]).toBe('Diciembre')
  })

  it('week starts on Monday (L M X J V S D)', () => {
    expect(WEEKDAY_INITIALS).toEqual(['L', 'M', 'X', 'J', 'V', 'S', 'D'])
    expect(WEEKDAY_NAMES[0]).toBe('Lunes')
    expect(WEEKDAY_NAMES[6]).toBe('Domingo')
  })
})

describe('isoDate', () => {
  it('pads month and day', () => {
    expect(isoDate(new Date(2026, 0, 5))).toBe('2026-01-05')
    expect(isoDate(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
})

describe('mondayIndex / isWeekend', () => {
  // 2026-10-19 is a Monday, 10-24 a Saturday, 10-25 a Sunday.
  it('Monday is 0 and Sunday is 6', () => {
    expect(mondayIndex(new Date(2026, 9, 19))).toBe(0)
    expect(mondayIndex(new Date(2026, 9, 20))).toBe(1)
    expect(mondayIndex(new Date(2026, 9, 24))).toBe(5)
    expect(mondayIndex(new Date(2026, 9, 25))).toBe(6)
  })

  it('marks Saturday and Sunday as weekend', () => {
    expect(isWeekend(new Date(2026, 9, 23))).toBe(false)
    expect(isWeekend(new Date(2026, 9, 24))).toBe(true)
    expect(isWeekend(new Date(2026, 9, 25))).toBe(true)
  })
})

describe('daysOfYear / daysOfMonth', () => {
  it('returns 365 days in a common year, 366 in a leap year', () => {
    expect(daysOfYear(2026)).toHaveLength(365)
    expect(daysOfYear(2028)).toHaveLength(366)
  })

  it('starts on Jan 1 and ends on Dec 31', () => {
    const days = daysOfYear(2026)
    expect(days[0].getMonth()).toBe(0)
    expect(days[0].getDate()).toBe(1)
    expect(days[days.length - 1].getMonth()).toBe(11)
    expect(days[days.length - 1].getDate()).toBe(31)
  })

  it('handles February in common and leap years', () => {
    expect(daysOfMonth(2026, 1)).toHaveLength(28)
    expect(daysOfMonth(2028, 1)).toHaveLength(29)
    expect(daysOfMonth(2026, 0)).toHaveLength(31)
  })
})

describe('weeksOfMonth', () => {
  it('uses 7 slots per week with nulls outside the month', () => {
    for (let month = 0; month < 12; month++) {
      const weeks = weeksOfMonth(2026, month)
      for (const week of weeks) expect(week).toHaveLength(7)

      const inMonth = weeks.flat().filter((d): d is Date => d !== null)
      expect(inMonth).toHaveLength(daysOfMonth(2026, month).length)
      // Leading blanks match the weekday of the 1st (Monday-first).
      expect(weeks[0].indexOf(inMonth[0])).toBe(mondayIndex(inMonth[0]))
      // The first real day of the month is the 1st.
      expect(inMonth[0].getDate()).toBe(1)
    }
  })

  it('orders days sequentially across weeks', () => {
    const days = weeksOfMonth(2026, 9).flat().filter((d): d is Date => d !== null)
    for (let i = 1; i < days.length; i++) {
      // Calendar-based (DST-proof): one calendar day after the previous.
      expect(days[i].getDate() - days[i - 1].getDate()).toBe(1)
    }
  })
})

describe('weeksOfYear', () => {
  it('covers every day of the year in 7-slot weeks', () => {
    const weeks = weeksOfYear(2026)
    for (const week of weeks) expect(week).toHaveLength(7)
    const days = weeks.flat().filter((d): d is Date => d !== null)
    expect(days).toHaveLength(365)
  })

  it('leap year has 366 slots filled', () => {
    const days = weeksOfYear(2028).flat().filter((d): d is Date => d !== null)
    expect(days).toHaveLength(366)
  })
})
