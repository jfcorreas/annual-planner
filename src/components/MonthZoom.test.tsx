import { describe, expect, it, vi } from 'vitest'
import { render } from '@testing-library/react'
import { MonthZoom } from './MonthZoom'
import type { Stats } from '../utils/stats'

const STATS: Stats = { counts: [], untagged: 0 }

function renderZoom(overrides: Partial<Parameters<typeof MonthZoom>[0]> = {}) {
  const view = render(
    <MonthZoom
      year={2026}
      month={4}
      daysData={{}}
      tags={[]}
      readOnly={false}
      clearing={false}
      stats={STATS}
      onDayClick={vi.fn()}
      onTagOpen={vi.fn()}
      onTagRemove={vi.fn()}
      onClose={vi.fn()}
      onPrev={vi.fn()}
      onNext={vi.fn()}
      {...overrides}
    />,
  )
  return view
}

describe('MonthZoom navigation', () => {
  it('shows prev/next buttons labeled with the neighboring month names', () => {
    const { container } = renderZoom({ month: 4 }) // mayo

    const buttons = Array.from(container.querySelectorAll('.zoom__bar button')).map(
      (b) => b.textContent ?? '',
    )
    expect(buttons.some((label) => label.includes('Abril'))).toBe(true)
    expect(buttons.some((label) => label.includes('Junio'))).toBe(true)
  })

  it('disables the previous button on January', () => {
    const { container } = renderZoom({ month: 0 }) // enero

    const prev = Array.from(container.querySelectorAll('.zoom__bar button')).find((b) =>
      b.textContent?.includes('Diciembre'),
    ) as HTMLButtonElement
    expect(prev.disabled).toBe(true)
  })

  it('disables the next button on December', () => {
    const { container } = renderZoom({ month: 11 }) // diciembre

    const next = Array.from(container.querySelectorAll('.zoom__bar button')).find((b) =>
      b.textContent?.includes('Enero'),
    ) as HTMLButtonElement
    expect(next.disabled).toBe(true)
  })
})
