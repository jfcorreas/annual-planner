import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import App from './App'
import { daysOfYear, isoDate } from './utils/dates'

const YEAR = new Date().getFullYear()

function renderApp() {
  const view = render(<App />)
  return view
}

function firstIso() {
  return isoDate(daysOfYear(YEAR)[0])
}

function dayCell(container: HTMLElement, iso: string): HTMLElement {
  const cell = container.querySelector(`.day[data-iso="${iso}"]`)
  if (!cell) throw new Error(`Day cell ${iso} not found`)
  return cell as HTMLElement
}

function chipsOf(cell: HTMLElement): HTMLElement[] {
  return [...cell.querySelectorAll('.tag-chip')] as HTMLElement[]
}

/** Click the number area of a day = apply the active tag. */
function fillDay(container: HTMLElement, iso: string) {
  fireEvent.click(dayCell(container, iso).querySelector('.day__number')!)
}

/** "Sin etiqueta" count shown in the month zoom stats footer. */
function zoomUntagged(container: HTMLElement): string | undefined {
  const items = [...container.querySelectorAll('.zoom__stats .stats__item')]
  const item = items.find((li) => li.textContent?.includes('Sin etiqueta'))
  return item?.querySelector('.stats__count')?.textContent
}

describe('render', () => {
  it('shows 12 months, the year and the stats footer', () => {
    const { container } = renderApp()
    expect(container.querySelectorAll('.month-col')).toHaveLength(12)
    expect(container.querySelectorAll('.day[data-iso]')).toHaveLength(daysOfYear(YEAR).length)
    expect(container.querySelector('.stats__year')?.textContent).toBe(String(YEAR))
  })

  it('starts with every day untagged', () => {
    const { container } = renderApp()
    const items = [...container.querySelectorAll('.stats__item')]
    const untagged = items.find((li) => li.textContent?.includes('Sin etiqueta'))
    expect(untagged?.textContent).toContain(String(daysOfYear(YEAR).length))
  })
})

describe('filling days', () => {
  it('applies the active tag with one click and toggles it off', () => {
    const { container } = renderApp()
    const iso = firstIso()

    fillDay(container, iso)
    expect(chipsOf(dayCell(container, iso))).toHaveLength(1)

    fillDay(container, iso)
    expect(chipsOf(dayCell(container, iso))).toHaveLength(0)
  })

  it('accepts a second tag but rejects the third with a toast', () => {
    const { container } = renderApp()
    const iso = firstIso()

    fillDay(container, iso) // Guardia 24h (active by default)
    fireEvent.click(container.querySelector('.palette .chip:nth-child(6)')!) // Festivo local
    fillDay(container, iso) // second tag
    expect(chipsOf(dayCell(container, iso))).toHaveLength(2)

    fireEvent.click(container.querySelector('.palette .chip:nth-child(3)')!)
    fillDay(container, iso) // would be the third
    expect(chipsOf(dayCell(container, iso))).toHaveLength(2)
    expect(container.querySelector('.toast')?.textContent).toContain('Máximo 2 etiquetas')
  })

  it('double click on a chip removes it without opening the modal', () => {
    const { container } = renderApp()
    const iso = firstIso()

    fillDay(container, iso) // Guardia 24h
    fireEvent.click(container.querySelector('.palette .chip:nth-child(6)')!) // Festivo local
    fillDay(container, iso) // second tag
    expect(chipsOf(dayCell(container, iso))).toHaveLength(2)

    const chip = chipsOf(dayCell(container, iso))[0]
    fireEvent.click(chip) // first click arms the modal…
    fireEvent.click(chip) // …second click inside the window removes it
    expect(chipsOf(dayCell(container, iso))).toHaveLength(1)
    expect(container.querySelector('.modal--tag-detail')).toBeNull()
  })

  it('press and hold a chip removes it and swallows the release click', () => {
    vi.useFakeTimers()
    try {
      const { container } = renderApp()
      const iso = firstIso()
      fillDay(container, iso)

      const chip = chipsOf(dayCell(container, iso))[0]
      fireEvent.pointerDown(chip)
      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect(chipsOf(dayCell(container, iso))).toHaveLength(0)
      expect(container.querySelector('.modal--tag-detail')).toBeNull()

      // The release click may land on the day underneath: it must not fill it.
      fireEvent.click(dayCell(container, iso).querySelector('.day__number')!)
      expect(chipsOf(dayCell(container, iso))).toHaveLength(0)
      expect(container.querySelector('.modal--tag-detail')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('clear mode empties a day in one click', () => {
    const { container } = renderApp()
    const iso = firstIso()

    fillDay(container, iso)
    fireEvent.click(container.querySelector('.chip--clear')!)
    fillDay(container, iso)
    expect(chipsOf(dayCell(container, iso))).toHaveLength(0)

    // Leave clear mode: filling works again.
    fireEvent.click(container.querySelector('.chip--clear')!)
    fillDay(container, iso)
    expect(chipsOf(dayCell(container, iso))).toHaveLength(1)
  })
})

describe('tag detail modal', () => {
  it('opens with one click and shows every detail of the application', async () => {
    const { container } = renderApp()
    const iso = firstIso()
    fillDay(container, iso)

    fireEvent.click(chipsOf(dayCell(container, iso))[0])
    await waitFor(() => expect(container.querySelector('.modal--tag-detail')).not.toBeNull())

    const modal = container.querySelector('.modal--tag-detail')!
    expect(modal.textContent).toContain('Guardia 24h')
    expect(modal.textContent).toContain('Trabajo')
    expect(modal.textContent).toContain('1 vez este año')
    expect((modal.querySelector('.tag-detail__form input') as HTMLInputElement).value).toBe('')
  })

  it('edits the subtitle and reflects it on the chip tooltip', async () => {
    const { container } = renderApp()
    const iso = firstIso()
    fillDay(container, iso)

    fireEvent.click(chipsOf(dayCell(container, iso))[0])
    await waitFor(() => expect(container.querySelector('.modal--tag-detail')).not.toBeNull())

    const modal = container.querySelector('.modal--tag-detail')!
    fireEvent.change(modal.querySelector('.tag-detail__form input')!, {
      target: { value: 'de tarde' },
    })
    fireEvent.click(modal.querySelector('.tag-detail__form button[type="submit"]')!)

    await waitFor(() => expect(container.querySelector('.modal--tag-detail')).toBeNull())
    expect(chipsOf(dayCell(container, iso))[0].title).toContain('de tarde')
  })

  it('removes the application with the modal button', async () => {
    const { container } = renderApp()
    const iso = firstIso()
    fillDay(container, iso)

    fireEvent.click(chipsOf(dayCell(container, iso))[0])
    await waitFor(() => expect(container.querySelector('.modal--tag-detail')).not.toBeNull())

    fireEvent.click(container.querySelector('.tag-detail__actions .btn')!)
    expect(chipsOf(dayCell(container, iso))).toHaveLength(0)
    expect(container.querySelector('.modal--tag-detail')).toBeNull()
  })

  it('closes with Esc', async () => {
    const { container } = renderApp()
    fillDay(container, firstIso())

    fireEvent.click(chipsOf(dayCell(container, firstIso()))[0])
    await waitFor(() => expect(container.querySelector('.modal--tag-detail')).not.toBeNull())

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.querySelector('.modal--tag-detail')).toBeNull()
  })

  it('shows the subtitle as a second line inside month chips', async () => {
    const { container } = renderApp()
    fillDay(container, firstIso())

    fireEvent.click(chipsOf(dayCell(container, firstIso()))[0])
    await waitFor(() => expect(container.querySelector('.modal--tag-detail')).not.toBeNull())
    const modal = container.querySelector('.modal--tag-detail')!
    fireEvent.change(modal.querySelector('.tag-detail__form input')!, {
      target: { value: 'de tarde' },
    })
    fireEvent.click(modal.querySelector('.tag-detail__form button[type="submit"]')!)

    fireEvent.click(container.querySelector('.month-col__zoom')!) // Enero
    const chip = container.querySelector('.zoom .tag-chip') as HTMLElement
    expect(chip.querySelector('.tag-chip__sub')?.textContent).toBe('de tarde')
    expect(chip.title).toContain('de tarde')
  })
})

describe('stats update', () => {
  it('counts the applied tag in the footer', () => {
    const { container } = renderApp()
    fillDay(container, firstIso())

    const items = [...container.querySelectorAll('.stats__item')]
    const guardia = items.find((li) => li.textContent?.includes('Guardia 24h'))
    expect(guardia?.querySelector('.stats__count')?.textContent).toBe('1')
  })
})

describe('month zoom', () => {
  it('opens over the year view and closes with Esc', () => {
    const { container } = renderApp()

    fireEvent.click(container.querySelector('.month-col__zoom')!)
    expect(container.querySelector('.zoom')).not.toBeNull()
    expect(container.querySelectorAll('.zoom__dow')).toHaveLength(7)

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(container.querySelector('.zoom')).toBeNull()
  })

  it('navigating to the next month updates the title and the stats shown', () => {
    const { container } = renderApp()

    fireEvent.click(container.querySelectorAll('.month-col__zoom')[5]) // Junio
    expect(container.querySelector('.zoom__title')?.textContent).toBe(`Junio ${YEAR}`)
    expect(zoomUntagged(container)).toBe('30') // junio tiene 30 días

    const next = [...container.querySelectorAll('.zoom__bar button')].find((b) =>
      b.textContent?.includes('Julio'),
    )!
    fireEvent.click(next)

    expect(container.querySelector('.zoom__title')?.textContent).toBe(`Julio ${YEAR}`)
    expect(zoomUntagged(container)).toBe('31') // julio tiene 31 días
  })

  it('a tag filled after navigating is saved on the displayed month', () => {
    const { container } = renderApp()

    fireEvent.click(container.querySelectorAll('.month-col__zoom')[5]) // Junio
    const next = [...container.querySelectorAll('.zoom__bar button')].find((b) =>
      b.textContent?.includes('Julio'),
    )!
    fireEvent.click(next)

    const july = `${YEAR}-07-01`
    const june = `${YEAR}-06-01`
    fireEvent.click(
      container.querySelector(`.zoom .day[data-iso="${july}"] .day__number`)!,
    )

    // The chip lands on July 1st (zoom + year view), not on June 1st.
    expect(
      container.querySelector(`.zoom .day[data-iso="${july}"]`)!.querySelectorAll('.tag-chip'),
    ).toHaveLength(1)
    expect(chipsOf(dayCell(container, july))).toHaveLength(1)
    expect(chipsOf(dayCell(container, june))).toHaveLength(0)
  })
})

describe('archive (read-only)', () => {
  it('blocks day editing and disables the palette until reopened', () => {
    const { container } = renderApp()
    const iso = firstIso()

    fireEvent.click(container.querySelector('.topbar .status')!)
    expect(container.querySelector('.topbar .status')?.textContent).toContain('Archivado')

    fillDay(container, iso)
    expect(chipsOf(dayCell(container, iso))).toHaveLength(0)
    expect((container.querySelector('.chip--clear') as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(container.querySelector('.topbar .status')!)
    fillDay(container, iso)
    expect(chipsOf(dayCell(container, iso))).toHaveLength(1)
  })
})

describe('tags editor', () => {
  it('creates a new tag shown in the list and the palette', () => {
    const { container } = renderApp()

    fireEvent.click(container.querySelector('.chip--add')!)
    expect(container.querySelector('.modal')).not.toBeNull()

    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Prueba tag' } })
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)

    const rows = [...container.querySelectorAll('.tags-list__item')]
    expect(rows.some((li) => li.textContent?.includes('Prueba tag'))).toBe(true)
    expect(
      [...container.querySelectorAll('.palette .chip')].some((c) =>
        c.textContent?.includes('Prueba tag'),
      ),
    ).toBe(true)
  })

  it('deletes a tag after confirmation', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { container } = renderApp()

    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Guardia 24h'),
    )!
    const before = container.querySelectorAll('.tags-list__item').length

    fireEvent.click(row.querySelectorAll('button')[1]) // 🗑️
    expect(container.querySelectorAll('.tags-list__item')).toHaveLength(before - 1)
    vi.restoreAllMocks()
  })

  it('manages tag types: add, rename and block deletion while in use', () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { container } = renderApp()

    fireEvent.click(container.querySelector('.chip--add')!)
    const typeInput = container.querySelector(
      '.types-editor__form input[type="text"]',
    ) as HTMLInputElement
    const typeSubmit = container.querySelector(
      '.types-editor__form button[type="submit"]',
    ) as HTMLButtonElement

    // Add a new type
    fireEvent.change(typeInput, { target: { value: 'Comunidad' } })
    fireEvent.click(typeSubmit)
    let rows = [...container.querySelectorAll('.types-list__item')]
    expect(rows).toHaveLength(5)
    expect(rows.some((li) => li.textContent?.includes('Comunidad'))).toBe(true)

    // It shows up in the tag form's "Tipo" select
    const select = container.querySelector('.tag-form select') as HTMLSelectElement
    expect([...select.options].some((o) => o.text === 'Comunidad')).toBe(true)

    // Rename it
    const communityRow = rows.find((li) => li.textContent?.includes('Comunidad'))!
    fireEvent.click(communityRow.querySelectorAll('button')[0]) // ✏️
    fireEvent.change(typeInput, { target: { value: 'Comunidad autónoma' } })
    fireEvent.click(typeSubmit)
    rows = [...container.querySelectorAll('.types-list__item')]
    expect(rows.some((li) => li.textContent?.includes('Comunidad autónoma'))).toBe(true)

    // Deleting a type still used by tags is blocked with a notice
    const usedRow = rows.find((li) => li.textContent?.startsWith('Trabajo'))!
    fireEvent.click(usedRow.querySelectorAll('button')[1]) // 🗑️
    expect(container.querySelectorAll('.types-list__item')).toHaveLength(5)
    expect(container.querySelector('.toast')?.textContent).toContain('lo usan 5 etiquetas')

    vi.restoreAllMocks()
  })
})

describe('persistence', () => {
  it('keeps filled days across a remount (localStorage)', () => {
    const first = renderApp()
    fillDay(first.container, firstIso())
    first.unmount()

    const second = renderApp()
    expect(chipsOf(dayCell(second.container, firstIso()))).toHaveLength(1)
  })
})
