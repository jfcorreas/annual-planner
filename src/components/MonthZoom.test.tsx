import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { MonthZoom } from './MonthZoom'
import type { Stats } from '../utils/stats'

const STATS: Stats = { counts: [], permits: [] }

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
      onDayInfo={vi.fn()}
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

/** Horizontal drag over the zoom, the way a finger (or the mouse) would do it. */
function swipe(view: ReturnType<typeof renderZoom>, fromX: number, toX: number, y = 150) {
  const zoom = view.container.querySelector('.zoom') as HTMLElement
  const move = (clientX: number) =>
    fireEvent.pointerMove(zoom, { pointerId: 7, pointerType: 'touch', buttons: 1, clientX, clientY: y })
  fireEvent.pointerDown(zoom, {
    pointerId: 7,
    pointerType: 'touch',
    buttons: 1,
    clientX: fromX,
    clientY: y,
  })
  move(toX)
  fireEvent.pointerUp(zoom, {
    pointerId: 7,
    pointerType: 'touch',
    buttons: 0,
    clientX: toX,
    clientY: y,
  })
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

describe('MonthZoom lateral scroll', () => {
  it('drags to the next month to the left and to the previous one to the right', () => {
    const onNext = vi.fn()
    const onPrev = vi.fn()
    const view = renderZoom({ month: 4, onNext, onPrev }) // mayo

    swipe(view, 300, 180) // finger to the left
    expect(onNext).toHaveBeenCalledTimes(1)
    expect(onPrev).not.toHaveBeenCalled()

    swipe(view, 120, 260) // finger to the right
    expect(onPrev).toHaveBeenCalledTimes(1)
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('ignores short drags and vertical ones', () => {
    const onNext = vi.fn()
    const onPrev = vi.fn()
    const view = renderZoom({ onNext, onPrev })
    const zoom = view.container.querySelector('.zoom') as HTMLElement
    const drag = (fromX: number, fromY: number, toX: number, toY: number) => {
      fireEvent.pointerDown(zoom, {
        pointerId: 7,
        pointerType: 'touch',
        buttons: 1,
        clientX: fromX,
        clientY: fromY,
      })
      fireEvent.pointerMove(zoom, {
        pointerId: 7,
        pointerType: 'touch',
        buttons: 1,
        clientX: toX,
        clientY: toY,
      })
      fireEvent.pointerUp(zoom, {
        pointerId: 7,
        pointerType: 'touch',
        buttons: 0,
        clientX: toX,
        clientY: toY,
      })
    }

    drag(300, 150, 270, 150) // only 30px wide
    drag(200, 300, 260, 60) // 60px sideways, but 240px up: a scroll, not a swipe
    expect(onNext).not.toHaveBeenCalled()
    expect(onPrev).not.toHaveBeenCalled()
  })

  it('stays inside the year: no swipe out of January or December', () => {
    const onPrev = vi.fn()
    const january = renderZoom({ month: 0, onPrev })
    swipe(january, 120, 280) // right, would be December
    expect(onPrev).not.toHaveBeenCalled()

    const onNext = vi.fn()
    const december = renderZoom({ month: 11, onNext })
    swipe(december, 300, 120) // left, would be January
    expect(onNext).not.toHaveBeenCalled()
  })

  it('swallows the click the swipe leaves behind, then clicks work again', () => {
    const onDayClick = vi.fn()
    const view = renderZoom({ onDayClick })
    const day = view.container.querySelector('.zoom .day[data-iso]') as HTMLElement

    swipe(view, 300, 160)
    fireEvent.click(day)
    expect(onDayClick).not.toHaveBeenCalled()

    fireEvent.click(day)
    expect(onDayClick).toHaveBeenCalledTimes(1)
  })
})
