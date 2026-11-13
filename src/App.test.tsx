import { describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, waitFor } from '@testing-library/react'
import App from './App'
import pkg from '../package.json'
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

/** Select a palette chip by its position (tags first, then the editor button). */
function selectTag(container: HTMLElement, position: number) {
  fireEvent.click(container.querySelector(`.palette .chip:nth-child(${position})`)!)
}

/**
 * Click a day's empty area (not the number) = apply the active tag. With no
 * tag selected the first one is picked, so the tests only say which tag.
 */
function fillDay(container: HTMLElement, iso: string) {
  if (!container.querySelector('.palette .chip--on')) selectTag(container, 1)
  fireEvent.click(dayCell(container, iso))
}

/** Checkbox of the tag form whose label contains the given text. */
function formCheckbox(container: HTMLElement, labelText: string): HTMLInputElement | null {
  const label = [...container.querySelectorAll('.tag-form label')].find((l) =>
    l.textContent?.includes(labelText),
  )
  return label?.querySelector('input[type="checkbox"]') ?? null
}

/** Number input of the tag form whose label contains the given text. */
function formNumber(container: HTMLElement, labelText: string): HTMLInputElement | null {
  const label = [...container.querySelectorAll('.tag-form label')].find((l) =>
    l.textContent?.includes(labelText),
  )
  return label?.querySelector('input[type="number"]') ?? null
}

/** Year button of a planner in the side panel. */
function yearButton(container: HTMLElement, year: number): HTMLElement {
  const button = [...container.querySelectorAll('.panel__year')].find(
    (b) => b.textContent === String(year),
  )
  if (!button) throw new Error(`Planner ${year} not found`)
  return button as HTMLElement
}

/** Open the tags editor, create a tag marked as Global, close it again. */
function createGlobalTag(container: HTMLElement, label: string) {
  fireEvent.click(container.querySelector('.chip--add')!)
  fireEvent.change(container.querySelector('.tag-form input[type="text"]')!, {
    target: { value: label },
  })
  fireEvent.click(formCheckbox(container, 'Global')!)
  fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
  fireEvent.click(container.querySelector('.modal__head .btn')!) // close editor
}

/** Count shown for a tag in the month zoom stats footer. */
function zoomCount(container: HTMLElement, label: string): string | undefined {
  const items = [...container.querySelectorAll('.zoom__stats .stats__item')]
  const item = items.find((li) => li.textContent?.includes(label))
  return item?.querySelector('.stats__count')?.textContent
}

describe('render', () => {
  it('shows 12 months, the year and the stats footer', () => {
    const { container } = renderApp()
    expect(container.querySelectorAll('.month-col')).toHaveLength(12)
    expect(container.querySelectorAll('.day[data-iso]')).toHaveLength(daysOfYear(YEAR).length)
    expect(container.querySelector('.stats__year')?.textContent).toBe(String(YEAR))
  })

  it('footer lists only included tags with no "Sin etiqueta" row', () => {
    const { container } = renderApp()
    const items = [...container.querySelectorAll('.stats__item')]
    // The three "Festivo …" defaults ship as holidays → out of the bars;
    // the rest are included (missing flag counts as included).
    expect(items.map((li) => li.querySelector('.stats__label')?.textContent)).toEqual([
      'Guardia 24h',
      'Guardia 17h',
      'Diurno 12h',
      'Nocturno 12h',
      'Turno 24h',
    ])
    expect(items.some((li) => li.textContent?.includes('Sin etiqueta'))).toBe(false)
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
      fireEvent.click(dayCell(container, iso))
      expect(chipsOf(dayCell(container, iso))).toHaveLength(0)
      expect(container.querySelector('.modal--tag-detail')).toBeNull()
      expect(container.querySelector('.modal--day-detail')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('dragging a chip (month swipe) cancels the press-and-hold removal', () => {
    vi.useFakeTimers()
    try {
      const { container } = renderApp()
      const iso = firstIso()
      fillDay(container, iso)

      const chip = chipsOf(dayCell(container, iso))[0]
      fireEvent.pointerDown(chip, { clientX: 40, clientY: 40 })
      fireEvent.pointerMove(chip, { clientX: 140, clientY: 44 }) // lateral drag
      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect(chipsOf(dayCell(container, iso))).toHaveLength(1)

      fireEvent.pointerUp(chip, { clientX: 140, clientY: 44 })
      // A hold without movement still removes it.
      fireEvent.pointerDown(chip, { clientX: 40, clientY: 40 })
      act(() => {
        vi.advanceTimersByTime(600)
      })
      expect(chipsOf(dayCell(container, iso))).toHaveLength(0)

      // The hold armed the trailing-click swallower: consume it here, so it
      // does not swallow the first click of the next test.
      fireEvent.click(document.body)
    } finally {
      vi.useRealTimers()
    }
  })

  it('with no tag selected a day click opens the day detail and fills nothing', () => {
    const { container } = renderApp()
    const iso = firstIso()

    expect(container.querySelectorAll('.palette .chip--on')).toHaveLength(0)
    expect(container.querySelector('.palette__label')?.textContent).toContain(
      'Sin etiqueta activa',
    )

    fireEvent.click(dayCell(container, iso))
    expect(container.querySelector('.modal--day-detail')).not.toBeNull()
    expect(chipsOf(dayCell(container, iso))).toHaveLength(0)
  })

  it('clicking the active tag deselects it, back to the day detail mode', () => {
    const { container } = renderApp()
    const iso = firstIso()
    const guardia = container.querySelector('.palette .chip') as HTMLElement

    fireEvent.click(guardia)
    expect(container.querySelectorAll('.palette .chip--on')).toHaveLength(1)

    fireEvent.click(guardia)
    expect(container.querySelectorAll('.palette .chip--on')).toHaveLength(0)

    fireEvent.click(dayCell(container, iso))
    expect(container.querySelector('.modal--day-detail')).not.toBeNull()
    expect(chipsOf(dayCell(container, iso))).toHaveLength(0)
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
    expect(chip.querySelector('.tag-chip__sub')?.textContent).toBe('(de tarde)')
    expect(chip.title).toContain('de tarde')
  })
})

describe('day chip text', () => {
  /** Set the subtitle of a day's first chip through the tag detail modal. */
  async function setSubtitle(container: HTMLElement, iso: string, value: string) {
    fireEvent.click(chipsOf(dayCell(container, iso))[0])
    await waitFor(() => expect(container.querySelector('.modal--tag-detail')).not.toBeNull())
    const modal = container.querySelector('.modal--tag-detail')!
    fireEvent.change(modal.querySelector('.tag-detail__form input')!, {
      target: { value },
    })
    fireEvent.click(modal.querySelector('.tag-detail__form button[type="submit"]')!)
    await waitFor(() => expect(container.querySelector('.modal--tag-detail')).toBeNull())
  }

  it('shows the acronym + "(subtitle)" on a single-tag year chip', async () => {
    const { container } = renderApp()
    const iso = firstIso()
    fillDay(container, iso)

    // A plain tag has no icon: the bar reads "G24" alone…
    expect(chipsOf(dayCell(container, iso))[0].textContent).toBe('G24')

    await setSubtitle(container, iso, 'Titular: Juanfran')
    const chip = chipsOf(dayCell(container, iso))[0]
    expect(chip.querySelector('.tag-chip__acro')?.textContent).toBe('G24')
    expect(chip.querySelector('.tag-chip__sub')?.textContent).toBe('(Titular: Juanfran)')
    expect(chip.textContent).toBe('G24(Titular: Juanfran)')
  })

  it('keeps only the acronym on a two-tag year chip (no icon, no subtitle)', async () => {
    const { container } = renderApp()
    const iso = firstIso()
    fillDay(container, iso)
    await setSubtitle(container, iso, 'de tarde')

    selectTag(container, 3) // Diurno 12h
    fillDay(container, iso)

    const chips = chipsOf(dayCell(container, iso))
    expect(chips).toHaveLength(2)
    const guardia = chips.find((c) => c.title.startsWith('Guardia 24h'))!
    const diurno = chips.find((c) => c.title.startsWith('Diurno 12h'))!
    expect(guardia.textContent).toBe('G24')
    expect(diurno.textContent).toBe('D12')
    // No room for the icon or the subtitle on a dot chip.
    expect(guardia.querySelector('.tag-chip__icon')).toBeNull()
    expect(diurno.querySelector('.tag-chip__icon')).toBeNull()
    expect(guardia.querySelector('.tag-chip__sub')).toBeNull()
    expect(diurno.querySelector('.tag-chip__sub')).toBeNull()
  })

  it('keeps the icon on a single-tag holiday year chip', () => {
    const { container } = renderApp()
    selectTag(container, 6) // Festivo local
    fillDay(container, firstIso())

    const chip = chipsOf(dayCell(container, firstIso()))[0]
    // Only words with a capital contribute: "local" is dropped → "F".
    expect(chip.textContent).toBe('🏖️ F')
  })

  it('a one-line month chip drops the label for the compact acronym', () => {
    const { container } = renderApp()
    fillDay(container, firstIso())

    fireEvent.click(container.querySelector('.month-col__zoom')!) // Enero
    const chip = container.querySelector('.zoom .tag-chip') as HTMLElement
    // No subtitle → a single line → CSS shows icon + acronym instead of the
    // full label (which stays on the tooltip and in the day detail).
    expect(chip.className).toContain('tag-chip--single')
    expect(chip.querySelector('.tag-chip__label')?.textContent).toBe('Guardia 24h')
    expect(chip.querySelector('.tag-chip__acro')?.textContent).toBe('G24')
  })

  it('a month chip with a subtitle keeps its two lines (no --single)', async () => {
    const { container } = renderApp()
    const iso = firstIso()
    fillDay(container, iso)
    await setSubtitle(container, iso, 'de tarde')

    fireEvent.click(container.querySelector('.month-col__zoom')!) // Enero
    const chip = container.querySelector('.zoom .tag-chip') as HTMLElement
    expect(chip.className).not.toContain('tag-chip--single')
    expect(chip.querySelector('.tag-chip__label')?.textContent).toBe('Guardia 24h')
    expect(chip.querySelector('.tag-chip__sub')?.textContent).toBe('(de tarde)')
  })
})

describe('day detail modal', () => {
  it('opens from the day number with every tag and subtitle in full', async () => {
    const { container } = renderApp()
    const iso = firstIso()
    fillDay(container, iso)

    // A subtitle set through the tag detail modal must be shown here too.
    fireEvent.click(chipsOf(dayCell(container, iso))[0])
    await waitFor(() => expect(container.querySelector('.modal--tag-detail')).not.toBeNull())
    fireEvent.change(container.querySelector('.tag-detail__form input')!, {
      target: { value: 'de tarde' },
    })
    fireEvent.click(container.querySelector('.tag-detail__form button[type="submit"]')!)

    fireEvent.click(dayCell(container, iso).querySelector('.day__number')!)
    const modal = container.querySelector('.modal--day-detail')
    expect(modal).not.toBeNull()
    expect(modal!.getAttribute('aria-modal')).toBe('true')
    expect(modal!.textContent).toContain(`1 de enero de ${YEAR}`)
    expect(modal!.textContent).toContain('Guardia 24h')
    expect(modal!.textContent).toContain('de tarde')
  })

  it('shows an empty state for a day with no tags', () => {
    const { container } = renderApp()

    fireEvent.click(dayCell(container, firstIso()).querySelector('.day__number')!)
    const modal = container.querySelector('.modal--day-detail')
    expect(modal).not.toBeNull()
    expect(modal!.textContent).toContain('Sin etiquetas este día.')
  })

  it('the number click opens the modal without filling or emptying the day', () => {
    const { container } = renderApp()
    const iso = firstIso()

    // Empty day: the modal opens and the day stays empty.
    fireEvent.click(dayCell(container, iso).querySelector('.day__number')!)
    expect(container.querySelector('.modal--day-detail')).not.toBeNull()
    expect(chipsOf(dayCell(container, iso))).toHaveLength(0)
    fireEvent.keyDown(window, { key: 'Escape' })

    // Filled day: the number does not toggle the tag off.
    fillDay(container, iso)
    fireEvent.click(dayCell(container, iso).querySelector('.day__number')!)
    expect(container.querySelector('.modal--day-detail')).not.toBeNull()
    expect(chipsOf(dayCell(container, iso))).toHaveLength(1)
  })

  it('closes with Escape, with the ✕ button and with the backdrop', () => {
    const { container } = renderApp()
    const iso = firstIso()
    const open = () =>
      fireEvent.click(dayCell(container, iso).querySelector('.day__number')!)
    const modal = () => container.querySelector('.modal--day-detail')

    open()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(modal()).toBeNull()

    open()
    fireEvent.click(modal()!.querySelector('.modal__head .btn')!)
    expect(modal()).toBeNull()

    open()
    fireEvent.click(container.querySelector('.modal-backdrop')!)
    expect(modal()).toBeNull()
  })

  it('opens from a day inside the month zoom too', () => {
    const { container } = renderApp()
    fillDay(container, firstIso())

    fireEvent.click(container.querySelector('.month-col__zoom')!) // Enero
    const zoomDay = container.querySelector('.zoom .day[data-iso]') as HTMLElement
    fireEvent.click(zoomDay.querySelector('.day__number')!)

    const modal = container.querySelector('.modal--day-detail')
    expect(modal).not.toBeNull()
    expect(modal!.textContent).toContain('Guardia 24h')

    // The number inside the zoom must not apply the active tag either.
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(zoomDay.querySelectorAll('.tag-chip')).toHaveLength(1)
  })

  it('opens in a read-only (archived) planner: viewing only', () => {
    const { container } = renderApp()
    fillDay(container, firstIso())
    fireEvent.click(container.querySelector('.topbar .status')!) // archivar

    fireEvent.click(dayCell(container, firstIso()).querySelector('.day__number')!)
    const modal = container.querySelector('.modal--day-detail')
    expect(modal).not.toBeNull()
    expect(modal!.textContent).toContain('Guardia 24h')
    // No editing controls in this modal.
    expect(modal!.querySelector('input')).toBeNull()
    expect(modal!.querySelector('button[type="submit"]')).toBeNull()
  })
})

describe('about modal', () => {
  it('opens from the info button and shows the version from package.json', () => {
    const { container } = renderApp()

    const button = container.querySelector('.topbar .btn--icon') as HTMLButtonElement | null
    expect(button).not.toBeNull()
    expect(button!.getAttribute('aria-label')).toBe('Acerca de la aplicación')
    expect(button!.title).toBe('Acerca de la aplicación')

    fireEvent.click(button!)
    const modal = container.querySelector('.modal--about')!
    expect(modal).not.toBeNull()
    expect(modal.getAttribute('aria-label')).toBe('Acerca de la aplicación')
    expect(modal.textContent).toContain(`Versión ${pkg.version}`)
    expect(modal.textContent).toMatch(/Versión \d+\.\d+\.\d+/)
    expect(modal.textContent).toContain('navegador')
  })

  it('closes with Escape, with the ✕ button and with the backdrop', () => {
    const { container } = renderApp()
    const open = () => fireEvent.click(container.querySelector('.topbar .btn--icon')!)
    const modal = () => container.querySelector('.modal--about')

    open()
    expect(modal()).not.toBeNull()
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(modal()).toBeNull()

    open()
    fireEvent.click(container.querySelector('.modal--about .modal__head .btn')!)
    expect(modal()).toBeNull()

    open()
    fireEvent.click(container.querySelector('.modal-backdrop')!)
    expect(modal()).toBeNull()
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

  it('navigating to the next month updates the title and the stats', () => {
    const { container } = renderApp()
    fillDay(container, `${YEAR}-06-01`) // Guardia 24h on June 1st

    fireEvent.click(container.querySelectorAll('.month-col__zoom')[5]) // Junio
    expect(container.querySelector('.zoom__title')?.textContent).toBe(`Junio ${YEAR}`)
    expect(zoomCount(container, 'Guardia 24h')).toBe('1')

    const next = [...container.querySelectorAll('.zoom__bar button')].find((b) =>
      b.textContent?.includes('Julio'),
    )!
    fireEvent.click(next)

    expect(container.querySelector('.zoom__title')?.textContent).toBe(`Julio ${YEAR}`)
    expect(zoomCount(container, 'Guardia 24h')).toBe('0')
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
    selectTag(container, 1) // no tag is active by default
    fireEvent.click(container.querySelector(`.zoom .day[data-iso="${july}"]`)!)

    // The chip lands on July 1st (zoom + year view), not on June 1st.
    expect(
      container.querySelector(`.zoom .day[data-iso="${july}"]`)!.querySelectorAll('.tag-chip'),
    ).toHaveLength(1)
    expect(chipsOf(dayCell(container, july))).toHaveLength(1)
    expect(chipsOf(dayCell(container, june))).toHaveLength(0)
  })
})

describe('archive (read-only)', () => {
  it('shows the day detail on a day click and disables the palette until reopened', () => {
    const { container } = renderApp()
    const iso = firstIso()

    fireEvent.click(container.querySelector('.topbar .status')!)
    expect(container.querySelector('.topbar .status')?.textContent).toContain('Archivado')

    fireEvent.click(dayCell(container, iso))
    expect(container.querySelector('.modal--day-detail')).not.toBeNull()
    expect(chipsOf(dayCell(container, iso))).toHaveLength(0)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect((container.querySelector('.chip--add') as HTMLButtonElement).disabled).toBe(true)

    fireEvent.click(container.querySelector('.topbar .status')!)
    fillDay(container, iso)
    expect(chipsOf(dayCell(container, iso))).toHaveLength(1)
  })
})

describe('tags editor', () => {
  it('shows the tags editor without a type field or types section', () => {
    const { container } = renderApp()

    fireEvent.click(container.querySelector('.chip--add')!)
    const modal = container.querySelector('.modal')!

    expect(modal.querySelector('select')).toBeNull()
    expect(modal.querySelector('.types-editor')).toBeNull()
    expect(modal.querySelector('.tags-list__cat')).toBeNull()
  })

  it('new tag form shows the statistics checkbox checked by default', () => {
    const { container } = renderApp()

    fireEvent.click(container.querySelector('.chip--add')!)
    const checkbox = container.querySelector(
      '.tag-form input[type="checkbox"]',
    ) as HTMLInputElement

    expect(checkbox).not.toBeNull()
    expect(checkbox.closest('label')?.textContent).toContain('Incluir en estadísticas')
    expect(checkbox.checked).toBe(true)
  })

  it('new tag form shows "Día Festivo" unchecked and statistics enabled by default', () => {
    const { container } = renderApp()

    fireEvent.click(container.querySelector('.chip--add')!)
    const holiday = formCheckbox(container, 'Día Festivo')
    const stats = formCheckbox(container, 'Incluir en estadísticas')

    expect(holiday).not.toBeNull()
    expect(holiday!.checked).toBe(false)
    expect(stats).not.toBeNull()
    expect(stats!.checked).toBe(true)
    expect(stats!.disabled).toBe(false)
  })

  it('checking "Día Festivo" unchecks and disables "Incluir en estadísticas"', () => {
    const { container } = renderApp()

    fireEvent.click(container.querySelector('.chip--add')!)
    const holiday = formCheckbox(container, 'Día Festivo')!
    const stats = formCheckbox(container, 'Incluir en estadísticas')!

    fireEvent.click(holiday)
    expect(holiday.checked).toBe(true)
    expect(stats.checked).toBe(false)
    expect(stats.disabled).toBe(true)

    // Unchecking the holiday box re-enables statistics but keeps it off:
    // it must be re-checked manually to count the tag again.
    fireEvent.click(holiday)
    expect(holiday.checked).toBe(false)
    expect(stats.disabled).toBe(false)
    expect(stats.checked).toBe(false)
  })

  it('permit checkbox reveals the required max field, forces stats on and is mutually exclusive with Día Festivo', () => {
    const { container } = renderApp()

    fireEvent.click(container.querySelector('.chip--add')!)
    const permit = formCheckbox(container, 'Permiso de trabajo')
    const stats = formCheckbox(container, 'Incluir en estadísticas')!
    const holiday = formCheckbox(container, 'Día Festivo')!

    // Hidden while the permit box is off.
    expect(permit).not.toBeNull()
    expect(permit!.checked).toBe(false)
    expect(formNumber(container, 'Máximo por año')).toBeNull()

    // Checking it shows the field and forces statistics on (disabled).
    fireEvent.click(permit!)
    const max = formNumber(container, 'Máximo por año')
    expect(max).not.toBeNull()
    expect(stats.checked).toBe(true)
    expect(stats.disabled).toBe(true)

    // Unchecking the permit re-enables statistics; the forced value stays on.
    fireEvent.click(permit!)
    expect(formNumber(container, 'Máximo por año')).toBeNull()
    expect(stats.disabled).toBe(false)
    expect(stats.checked).toBe(true)

    // Mutual exclusivity: Día Festivo unchecks the permit…
    fireEvent.click(permit!)
    fireEvent.click(holiday)
    expect(holiday.checked).toBe(true)
    expect(permit!.checked).toBe(false)
    expect(formNumber(container, 'Máximo por año')).toBeNull()
    expect(stats.checked).toBe(false)
    expect(stats.disabled).toBe(true)

    // …and the permit unchecks Día Festivo.
    fireEvent.click(permit!)
    expect(permit!.checked).toBe(true)
    expect(holiday.checked).toBe(false)
    expect(stats.checked).toBe(true)
    expect(stats.disabled).toBe(true)
  })

  it('permit: save is blocked until "Máximo por año" is an integer ≥ 1', () => {
    const { container } = renderApp()

    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Permiso guardia' } })
    const submit = container.querySelector('.tag-form button[type="submit"]') as HTMLButtonElement

    // Without the permit box the name alone is enough to save.
    expect(submit.disabled).toBe(false)

    // Permit on: the max is required.
    fireEvent.click(formCheckbox(container, 'Permiso de trabajo')!)
    expect(submit.disabled).toBe(true)

    const max = formNumber(container, 'Máximo por año')!
    const changeMax = (value: string) => fireEvent.change(max, { target: { value } })

    changeMax('0') // below 1
    expect(submit.disabled).toBe(true)
    changeMax('2.5') // not a whole number
    expect(submit.disabled).toBe(true)
    changeMax('abc') // not a number
    expect(submit.disabled).toBe(true)

    changeMax('5')
    expect(submit.disabled).toBe(false)
  })

  it('permit: the box and its max are saved and loaded back when editing', () => {
    const { container } = renderApp()

    // Create a permit tag with a max of 10.
    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Permiso guardia' } })
    fireEvent.click(formCheckbox(container, 'Permiso de trabajo')!)
    fireEvent.change(formNumber(container, 'Máximo por año')!, { target: { value: '10' } })
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // Reopen and edit it: box checked, max loaded back, stats forced on.
    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Permiso guardia'),
    )!
    fireEvent.click(row.querySelectorAll('button')[0]) // ✏️

    const permit = formCheckbox(container, 'Permiso de trabajo')!
    expect(permit.checked).toBe(true)
    expect(formNumber(container, 'Máximo por año')?.value).toBe('10')
    const stats = formCheckbox(container, 'Incluir en estadísticas')!
    expect(stats.checked).toBe(true)
    expect(stats.disabled).toBe(true)

    // Change the max and save; reopening shows the new value.
    fireEvent.change(formNumber(container, 'Máximo por año')!, { target: { value: '3' } })
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    fireEvent.click(container.querySelector('.chip--add')!)
    const savedRow = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Permiso guardia'),
    )!
    fireEvent.click(savedRow.querySelectorAll('button')[0]) // ✏️
    expect(formCheckbox(container, 'Permiso de trabajo')!.checked).toBe(true)
    expect(formNumber(container, 'Máximo por año')?.value).toBe('3')
  })

  it('creating a tag unchecked keeps it out of the stats but in the palette and on days', () => {
    const { container } = renderApp()

    // Create the tag with the statistics flag off.
    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Sin contar' } })
    const checkbox = container.querySelector(
      '.tag-form input[type="checkbox"]',
    ) as HTMLInputElement
    fireEvent.click(checkbox)
    expect(checkbox.checked).toBe(false)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // Not in the year stats…
    const items = [...container.querySelectorAll('.stats__item')]
    expect(items.some((li) => li.textContent?.includes('Sin contar'))).toBe(false)

    // …but in the palette, and it applies to days like any other tag.
    const paletteChip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Sin contar'),
    )
    expect(paletteChip).toBeTruthy()
    fireEvent.click(paletteChip!)
    fillDay(container, firstIso())
    expect(
      chipsOf(dayCell(container, firstIso())).some((c) =>
        c.getAttribute('title')?.startsWith('Sin contar'),
      ),
    ).toBe(true)
  })

  it('editing a tag loads its flag and hides it from the year and zoom bars', () => {
    const { container } = renderApp()

    // Uncheck a default tag (missing flag = included) while editing it.
    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Guardia 24h'),
    )!
    fireEvent.click(row.querySelectorAll('button')[0]) // ✏️
    const checkbox = container.querySelector(
      '.tag-form input[type="checkbox"]',
    ) as HTMLInputElement
    expect(checkbox.checked).toBe(true) // old data: no flag shows as included
    fireEvent.click(checkbox)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // Its row is gone from the year footer…
    const footerItems = [...container.querySelectorAll('.stats__item')]
    expect(footerItems.some((li) => li.textContent?.includes('Guardia 24h'))).toBe(false)

    // Reopen and edit it again: the saved flag is loaded back as unchecked.
    fireEvent.click(container.querySelector('.chip--add')!)
    const savedRow = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Guardia 24h'),
    )!
    fireEvent.click(savedRow.querySelectorAll('button')[0]) // ✏️
    const savedCheckbox = container.querySelector(
      '.tag-form input[type="checkbox"]',
    ) as HTMLInputElement
    expect(savedCheckbox.checked).toBe(false)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // …and from the month zoom bar too.
    fireEvent.click(container.querySelectorAll('.month-col__zoom')[0]) // Enero
    const zoomItems = [...container.querySelectorAll('.zoom__stats .stats__item')]
    expect(zoomItems.some((li) => li.textContent?.includes('Guardia 24h'))).toBe(false)
  })

  it('loads old data without the flag counting every tag', () => {
    // Data saved before the flag existed: tags carry no `inStats` at all.
    const oldData = {
      version: 2,
      planners: [
        {
          id: 'planner-old',
          year: YEAR,
          name: 'Planificador viejo',
          status: 'activo',
          tags: [{ id: 'old-tag', label: 'Etiqueta vieja', color: '#facc15' }],
          days: { [`${YEAR}-01-01`]: [{ tagId: 'old-tag' }] },
        },
      ],
    }
    localStorage.setItem('annual-planner:v2', JSON.stringify(oldData))

    const { container } = renderApp()

    // The counter keeps counting it: applied on Jan 1st, it shows 1.
    const items = [...container.querySelectorAll('.stats__item')]
    const oldRow = items.find((li) => li.textContent?.includes('Etiqueta vieja'))
    expect(oldRow?.querySelector('.stats__count')?.textContent).toBe('1')

    // And the editor shows it as included (checked).
    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Etiqueta vieja'),
    )!
    fireEvent.click(row.querySelectorAll('button')[0]) // ✏️
    const checkbox = container.querySelector(
      '.tag-form input[type="checkbox"]',
    ) as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('new tag form defaults to checked again after saving an edit', () => {
    const { container } = renderApp()

    // Uncheck an existing tag and save; the form returns to create mode.
    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Guardia 24h'),
    )!
    fireEvent.click(row.querySelectorAll('button')[0]) // ✏️
    fireEvent.click(container.querySelector('.tag-form input[type="checkbox"]')!)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)

    // Still in the editor: the new-tag form starts checked (AC1 default).
    const checkbox = container.querySelector(
      '.tag-form input[type="checkbox"]',
    ) as HTMLInputElement
    expect(checkbox.checked).toBe(true)
  })

  it('checking "Global" saves it, shows the 🌐 badge and loads the choice back', () => {
    const { container } = renderApp()

    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Compartida' } })
    fireEvent.click(formCheckbox(container, 'Global')!)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)

    // The new row shows the 🌐 badge…
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Compartida'),
    )!
    expect(row.querySelector('.tags-list__label')!.textContent).toContain('🌐')

    // …while a local tag does not.
    const localRow = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Guardia 24h'),
    )!
    expect(localRow.querySelector('.tags-list__label')!.textContent).not.toContain('🌐')

    // Editing loads the saved choice back into the form.
    fireEvent.click(row.querySelectorAll('button')[0]) // ✏️
    expect(formCheckbox(container, 'Global')!.checked).toBe(true)
  })

  it('🌐 shows in the detail modal but not in palette, day chips or statistics', async () => {
    const { container } = renderApp()

    // Create a global tag and apply it to the first day.
    createGlobalTag(container, 'Compartida')

    const paletteChip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Compartida'),
    )!
    fireEvent.click(paletteChip)
    fillDay(container, firstIso())

    // Palette chip: no badge.
    expect(paletteChip.textContent).not.toContain('🌐')

    // Day chip (year and month zoom share DayCell): no badge.
    const chip = chipsOf(dayCell(container, firstIso())).find((c) =>
      c.getAttribute('title')?.startsWith('Compartida'),
    )!
    expect(chip.textContent).not.toContain('🌐')

    // Statistics row: no badge.
    const statsRow = [...container.querySelectorAll('.stats__item')].find((li) =>
      li.textContent?.includes('Compartida'),
    )!
    expect(statsRow.textContent).not.toContain('🌐')

    // Detail modal title: the badge is there.
    fireEvent.click(chip)
    await waitFor(() => expect(container.querySelector('.tag-detail__title')).not.toBeNull())
    const title = container.querySelector('.tag-detail__title')!
    expect(title.textContent).toContain('Compartida')
    expect(title.textContent).toContain('🌐')
  })

  it('a global tag appears in the palette and editor of every planner, including one created through the panel', () => {
    const { container } = renderApp()
    const inPalette = (label: string) =>
      [...container.querySelectorAll('.palette .chip')].some((c) =>
        c.textContent?.includes(label),
      )

    // Create the global tag in the first planner.
    createGlobalTag(container, 'Compartida')

    // Create a second planner through the panel (year defaults to the next one).
    fireEvent.click(container.querySelector('.panel__new')!)
    fireEvent.click(container.querySelector('.panel__create button[type="submit"]')!)

    // The new planner shows it in the palette…
    expect(inPalette('Compartida')).toBe(true)
    // …and in its editor list.
    fireEvent.click(container.querySelector('.chip--add')!)
    const rows = [...container.querySelectorAll('.tags-list__item')]
    expect(rows.some((li) => li.textContent?.includes('Compartida'))).toBe(true)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close editor

    // Switching back to the first planner keeps it too.
    fireEvent.click(yearButton(container, YEAR))
    expect(inPalette('Compartida')).toBe(true)
  })

  it('editing a global tag’s name and color is visible after switching to another planner', () => {
    const { container } = renderApp()

    // Create the global tag in the first planner, then a second planner.
    createGlobalTag(container, 'Compartida')
    fireEvent.click(container.querySelector('.panel__new')!)
    fireEvent.click(container.querySelector('.panel__create button[type="submit"]')!)

    // Back in the first planner: rename it and recolor it.
    fireEvent.click(yearButton(container, YEAR))
    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Compartida'),
    )!
    fireEvent.click(row.querySelectorAll('button')[0]) // ✏️
    fireEvent.change(container.querySelector('.tag-form input[type="text"]')!, {
      target: { value: 'Renombrada' },
    })
    fireEvent.click(container.querySelector('[aria-label="Color #db2777"]')!)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close editor

    // The second planner shows the same name and color.
    fireEvent.click(yearButton(container, YEAR + 1))
    const chip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Renombrada'),
    )!
    expect(chip.querySelector('.chip__dot')!.getAttribute('style')).toContain('rgb(219, 39, 119)')
    expect(
      [...container.querySelectorAll('.palette .chip')].some((c) =>
        c.textContent?.includes('Compartida'),
      ),
    ).toBe(false)

    // …and so does its editor list.
    fireEvent.click(container.querySelector('.chip--add')!)
    const rows = [...container.querySelectorAll('.tags-list__item')]
    expect(rows.some((li) => li.textContent?.includes('Renombrada'))).toBe(true)
    expect(rows.some((li) => li.textContent?.includes('Compartida'))).toBe(false)
  })

  it('unmarking a global tag used by another planner is blocked with a toast', () => {
    const { container } = renderApp()

    // Global tag created in planner 1…
    createGlobalTag(container, 'Compartida')

    // …used on a day by planner 2…
    fireEvent.click(container.querySelector('.panel__new')!)
    fireEvent.click(container.querySelector('.panel__create button[type="submit"]')!)
    const paletteChip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Compartida'),
    )!
    fireEvent.click(paletteChip)
    // Planner 2 shows its own year (YEAR + 1): fill its first day.
    fillDay(container, isoDate(daysOfYear(YEAR + 1)[0]))

    // …then unmarked from planner 1: blocked with a toast.
    fireEvent.click(yearButton(container, YEAR))
    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Compartida'),
    )!
    fireEvent.click(row.querySelectorAll('button')[0]) // ✏️
    fireEvent.click(formCheckbox(container, 'Global')!) // uncheck
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)

    const toast = container.querySelector('.toast')
    expect(toast?.textContent).toContain('Compartida')
    expect(toast?.textContent).toContain('se usa en otro planificador')
    expect(toast?.textContent).toContain('antes de hacerla local')

    // The tag stays global: the 🌐 badge is still in the list.
    const stillRow = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Compartida'),
    )!
    expect(stillRow.querySelector('.tags-list__label')!.textContent).toContain('🌐')
  })

  it('unmarking a global tag unused elsewhere makes it local to the current planner', () => {
    const { container } = renderApp()
    const rowOf = (label: string) =>
      [...container.querySelectorAll('.tags-list__item')].find((li) =>
        li.textContent?.includes(label),
      )!

    // Global tag in planner 1; planner 2 gets the copy (nothing applied anywhere).
    createGlobalTag(container, 'Compartida')
    fireEvent.click(container.querySelector('.panel__new')!)
    fireEvent.click(container.querySelector('.panel__create button[type="submit"]')!)
    fireEvent.click(yearButton(container, YEAR))

    // Unmark from planner 1: allowed (no other planner uses it).
    fireEvent.click(container.querySelector('.chip--add')!)
    fireEvent.click(rowOf('Compartida').querySelectorAll('button')[0]) // ✏️
    fireEvent.click(formCheckbox(container, 'Global')!) // uncheck
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)

    expect(container.querySelector('.toast')?.textContent ?? '').not.toContain(
      'se usa en otro planificador',
    )
    // Badge gone in the current planner…
    expect(rowOf('Compartida').querySelector('.tags-list__label')!.textContent).not.toContain(
      '🌐',
    )
    // …and the form loads it back as local.
    fireEvent.click(rowOf('Compartida').querySelectorAll('button')[0]) // ✏️
    expect(formCheckbox(container, 'Global')!.checked).toBe(false)

    // Now local: renaming in planner 1 no longer reaches planner 2.
    fireEvent.change(container.querySelector('.tag-form input[type="text"]')!, {
      target: { value: 'Local ahora' },
    })
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!)

    fireEvent.click(yearButton(container, YEAR + 1))
    fireEvent.click(container.querySelector('.chip--add')!)
    // The copy is still there, unflagged and untouched by the rename.
    const otherRow = rowOf('Compartida')
    expect(otherRow.querySelector('.tags-list__label')!.textContent).not.toContain('🌐')
    expect(
      [...container.querySelectorAll('.tags-list__item')].some((li) =>
        li.textContent?.includes('Local ahora'),
      ),
    ).toBe(false)
  })

  it('deleting a global tag used in planners is blocked with the total-usage toast', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { container } = renderApp()

    // Global tag in planner 1, applied on two days.
    createGlobalTag(container, 'Compartida')
    const paletteChip = () =>
      [...container.querySelectorAll('.palette .chip')].find((c) =>
        c.textContent?.includes('Compartida'),
      )!
    fireEvent.click(paletteChip())
    fillDay(container, isoDate(daysOfYear(YEAR)[0]))
    fillDay(container, isoDate(daysOfYear(YEAR)[1]))

    // Planner 2 uses it on one more day.
    fireEvent.click(container.querySelector('.panel__new')!)
    fireEvent.click(container.querySelector('.panel__create button[type="submit"]')!)
    fireEvent.click(paletteChip())
    fillDay(container, isoDate(daysOfYear(YEAR + 1)[0]))

    // Back in planner 1: try to delete it from the editor.
    fireEvent.click(yearButton(container, YEAR))
    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Compartida'),
    )!
    const before = container.querySelectorAll('.tags-list__item').length
    fireEvent.click(row.querySelectorAll('button')[1]) // 🗑️

    // Blocked: no confirmation asked, toast shows the total across planners.
    expect(confirmSpy).not.toHaveBeenCalled()
    const toast = container.querySelector('.toast')
    expect(toast?.textContent).toContain('Compartida')
    expect(toast?.textContent).toContain('3 días en 2 planificadores')
    expect(container.querySelectorAll('.tags-list__item')).toHaveLength(before)
    vi.restoreAllMocks()
  })

  it('deleting an unused global tag removes it from every planner', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { container } = renderApp()

    // Global tag in planner 1; planner 2 gets the copy (no usage anywhere).
    createGlobalTag(container, 'Compartida')
    fireEvent.click(container.querySelector('.panel__new')!)
    fireEvent.click(container.querySelector('.panel__create button[type="submit"]')!)

    // Delete it from planner 1: the usual confirm is asked…
    fireEvent.click(yearButton(container, YEAR))
    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Compartida'),
    )!
    const before = container.querySelectorAll('.tags-list__item').length
    fireEvent.click(row.querySelectorAll('button')[1]) // 🗑️
    expect(confirmSpy).toHaveBeenCalledWith('¿Eliminar la etiqueta “Compartida”?')
    expect(container.querySelectorAll('.tags-list__item')).toHaveLength(before - 1)

    // …and it is gone from planner 1's palette.
    fireEvent.click(container.querySelector('.modal__head .btn')!)
    expect(
      [...container.querySelectorAll('.palette .chip')].some((c) =>
        c.textContent?.includes('Compartida'),
      ),
    ).toBe(false)

    // Planner 2 lost it too: palette and editor list.
    fireEvent.click(yearButton(container, YEAR + 1))
    expect(
      [...container.querySelectorAll('.palette .chip')].some((c) =>
        c.textContent?.includes('Compartida'),
      ),
    ).toBe(false)
    fireEvent.click(container.querySelector('.chip--add')!)
    expect(
      [...container.querySelectorAll('.tags-list__item')].some((li) =>
        li.textContent?.includes('Compartida'),
      ),
    ).toBe(false)
    vi.restoreAllMocks()
  })

  it('creates a tag with name and color shown in list and palette', () => {
    const { container } = renderApp()

    fireEvent.click(container.querySelector('.chip--add')!)
    expect(container.querySelector('.modal')).not.toBeNull()

    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Prueba tag' } })
    // Pick a non-default color (the form starts on the first swatch).
    fireEvent.click(container.querySelector('[aria-label="Color #db2777"]')!)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)

    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Prueba tag'),
    )
    expect(row).toBeTruthy()
    // jsdom serializes #db2777 as rgb(); the card paints it on its left edge.
    expect(row!.getAttribute('style')).toContain('border-left-color: rgb(219, 39, 119)')

    const chip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Prueba tag'),
    )
    expect(chip).toBeTruthy()
    expect(chip!.querySelector('.chip__dot')!.getAttribute('style')).toContain('rgb(219, 39, 119)')
  })

  it('applies the newly created tag to a day with its color on the chip', () => {
    const { container } = renderApp()

    // Create the tag.
    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Etiqueta nueva' } })
    fireEvent.click(container.querySelector('[aria-label="Color #0891b2"]')!)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // Select it in the palette and fill a day.
    const paletteChip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Etiqueta nueva'),
    )!
    fireEvent.click(paletteChip)
    fillDay(container, firstIso())

    const chips = chipsOf(dayCell(container, firstIso()))
    // Year-view chips carry the label in the title attribute, not as text.
    const applied = chips.find((c) => c.getAttribute('title')?.startsWith('Etiqueta nueva'))
    expect(applied).toBeTruthy()
    expect(applied!.getAttribute('style')).toContain('rgb(8, 145, 178)')
  })

  it('propagates a rename and recolor to day chips and the detail view', async () => {
    const { container } = renderApp()

    // Apply the default first tag (Guardia 24h) to a day.
    fillDay(container, firstIso())
    const chip = chipsOf(dayCell(container, firstIso()))[0]
    expect(chip.getAttribute('title')?.startsWith('Guardia 24h')).toBe(true)

    // Rename and recolor it in the editor.
    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Guardia 24h'),
    )!
    fireEvent.click(row.querySelectorAll('button')[0]) // ✏️
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Guardia renombrada' } })
    fireEvent.click(container.querySelector('[aria-label="Color #db2777"]')!)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // The day chip shows the new name and color with no extra step.
    const renamed = chipsOf(dayCell(container, firstIso()))[0]
    expect(renamed.getAttribute('title')?.startsWith('Guardia renombrada')).toBe(true)
    expect(renamed.getAttribute('style')).toContain('rgb(219, 39, 119)')

    // The detail view shows the new name and color too (click = 250ms debounce).
    fireEvent.click(renamed)
    await waitFor(() => expect(container.querySelector('.modal--tag-detail')).not.toBeNull())
    const modal = container.querySelector('.modal--tag-detail')!
    expect(modal.querySelector('.tag-detail__title')!.textContent).toContain('Guardia renombrada')
    expect(modal.textContent).toContain('#db2777')
  })

  it('blocks deleting a tag in use with a usage-count toast', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { container } = renderApp()

    // Apply the tag to a day, then try to delete it from the editor.
    fillDay(container, firstIso())
    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Guardia 24h'),
    )!
    const before = container.querySelectorAll('.tags-list__item').length

    fireEvent.click(row.querySelectorAll('button')[1]) // 🗑️

    // Blocked: no confirmation asked, toast shows the usage count, list intact.
    expect(confirmSpy).not.toHaveBeenCalled()
    const toast = container.querySelector('.toast')
    expect(toast?.textContent).toContain('Guardia 24h')
    expect(toast?.textContent).toContain('1 día')
    expect(container.querySelectorAll('.tags-list__item')).toHaveLength(before)

    // Still on its day after closing the editor.
    fireEvent.click(container.querySelector('.modal__head .btn')!)
    expect(
      chipsOf(dayCell(container, firstIso())).some((c) =>
        c.getAttribute('title')?.startsWith('Guardia 24h'),
      ),
    ).toBe(true)
    vi.restoreAllMocks()
  })

  it('deletes an unused tag from the list and the palette', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { container } = renderApp()

    // The tag is not applied on any day, so deletion is allowed after confirm.
    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Guardia 24h'),
    )!
    const before = container.querySelectorAll('.tags-list__item').length

    fireEvent.click(row.querySelectorAll('button')[1]) // 🗑️
    expect(confirmSpy).toHaveBeenCalledWith('¿Eliminar la etiqueta “Guardia 24h”?')
    expect(container.querySelectorAll('.tags-list__item')).toHaveLength(before - 1)

    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // Gone from the palette too.
    expect(
      [...container.querySelectorAll('.palette .chip')].some((c) =>
        c.textContent?.includes('Guardia 24h'),
      ),
    ).toBe(false)
    vi.restoreAllMocks()
  })

  it('creating a holiday tag keeps its name and color in list and palette', () => {
    const { container } = renderApp()

    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Puente largo' } })
    fireEvent.click(container.querySelector('[aria-label="Color #db2777"]')!)
    fireEvent.click(formCheckbox(container, 'Día Festivo')!)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)

    // Back in create mode the holiday box starts unchecked again (AC default).
    expect(formCheckbox(container, 'Día Festivo')!.checked).toBe(false)

    // Name and color are kept in the editor list (still open)…
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Puente largo'),
    )
    expect(row).toBeTruthy()
    expect(row!.getAttribute('style')).toContain('border-left-color: rgb(219, 39, 119)')
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // …in the palette…
    const chip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Puente largo'),
    )
    expect(chip).toBeTruthy()
    expect(chip!.querySelector('.chip__dot')!.getAttribute('style')).toContain('rgb(219, 39, 119)')

    // …and the holiday flag survived: editing the tag loads it back checked.
    fireEvent.click(container.querySelector('.chip--add')!)
    const savedRow = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Puente largo'),
    )!
    fireEvent.click(savedRow.querySelectorAll('button')[0]) // ✏️
    const savedInput = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    expect(savedInput.value).toBe('Puente largo')
    expect(formCheckbox(container, 'Día Festivo')!.checked).toBe(true)
  })

  it('holiday tag shows the 🏖️ icon in the palette and the editor list', () => {
    const { container } = renderApp()

    // Create a holiday tag.
    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Puente' } })
    fireEvent.click(formCheckbox(container, 'Día Festivo')!)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)

    // Editor list: the holiday row carries the icon, regular rows do not.
    const holidayRow = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Puente'),
    )
    expect(holidayRow?.textContent).toContain('🏖️')
    const regularRow = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Guardia 24h'),
    )
    expect(regularRow?.textContent).not.toContain('🏖️')

    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // Palette: same rule for the chips.
    const holidayChip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Puente'),
    )
    expect(holidayChip?.textContent).toContain('🏖️')
    const regularChip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Guardia 24h'),
    )
    expect(regularChip?.textContent).not.toContain('🏖️')
  })

  it('permit tag shows the 🪪 icon in the palette and the editor list; regular tags show none', () => {
    const { container } = renderApp()

    // Create a permit tag (with its required max).
    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Permiso médico' } })
    fireEvent.click(formCheckbox(container, 'Permiso de trabajo')!)
    fireEvent.change(formNumber(container, 'Máximo por año')!, { target: { value: '4' } })
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)

    // Editor list: the permit row carries the icon, regular rows do not.
    const permitRow = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Permiso médico'),
    )
    expect(permitRow?.textContent).toContain('🪪')
    const regularRow = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Guardia 24h'),
    )
    expect(regularRow?.textContent).not.toContain('🪪')

    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // Palette: same rule for the chips.
    const permitChip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Permiso médico'),
    )
    expect(permitChip?.textContent).toContain('🪪')
    const regularChip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Guardia 24h'),
    )
    expect(regularChip?.textContent).not.toContain('🪪')
  })

  it('holiday tag shows the 🏖️ icon on year and month chips; regular tags show none', () => {
    const { container } = renderApp()
    const iso = firstIso()

    // Create the holiday tag through the editor.
    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Puente' } })
    fireEvent.click(formCheckbox(container, 'Día Festivo')!)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // Apply both tags to one day: the regular one first, the holiday one after.
    fillDay(container, iso) // Guardia 24h (active by default)
    const holidayPaletteChip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Puente'),
    )!
    fireEvent.click(holidayPaletteChip)
    fillDay(container, iso)

    // Year chips of a two-tag day: acronym only, no icon — a dot chip has
    // no room for it (titles keep the plain label, tooltips are unaffected).
    const yearChips = chipsOf(dayCell(container, iso))
    expect(yearChips).toHaveLength(2)
    const holidayYear = yearChips.find((c) => c.getAttribute('title')?.startsWith('Puente'))!
    const regularYear = yearChips.find((c) => c.getAttribute('title')?.startsWith('Guardia 24h'))!
    expect(holidayYear.textContent).toBe('P')
    expect(regularYear.textContent).toBe('G24')

    // A day with a single holiday tag is wide enough to keep the icon.
    const wideIso = isoDate(daysOfYear(YEAR)[1])
    fillDay(container, wideIso)
    const wideChip = chipsOf(dayCell(container, wideIso))[0]
    expect(wideChip.textContent).toContain('🏖️')
    expect(wideChip.textContent).toContain('P')

    // Month chips: same rule next to the label.
    fireEvent.click(container.querySelector('.month-col__zoom')!) // Enero
    const zoomChips = [...container.querySelectorAll('.zoom .tag-chip')] as HTMLElement[]
    const holidayMonth = zoomChips.find((c) => c.getAttribute('title')?.startsWith('Puente'))!
    const regularMonth = zoomChips.find(
      (c) => c.getAttribute('title')?.startsWith('Guardia 24h'),
    )!
    expect(holidayMonth.textContent).toContain('🏖️')
    expect(holidayMonth.textContent).toContain('Puente')
    expect(regularMonth.textContent).toContain('Guardia 24h')
    expect(regularMonth.textContent).not.toContain('🏖️')
  })

  it('permit tag shows the 🪪 icon on year and month chips; regular tags show none', () => {
    const { container } = renderApp()
    const iso = firstIso()

    // Create the permit tag through the editor.
    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Permiso médico' } })
    fireEvent.click(formCheckbox(container, 'Permiso de trabajo')!)
    fireEvent.change(formNumber(container, 'Máximo por año')!, { target: { value: '4' } })
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // Apply both tags to one day: the regular one first, the permit after.
    fillDay(container, iso) // Guardia 24h (active by default)
    const permitPaletteChip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Permiso médico'),
    )!
    fireEvent.click(permitPaletteChip)
    fillDay(container, iso)

    // Year chips of a two-tag day: acronym only, no icon.
    const yearChips = chipsOf(dayCell(container, iso))
    expect(yearChips).toHaveLength(2)
    const permitYear = yearChips.find((c) =>
      c.getAttribute('title')?.startsWith('Permiso médico'),
    )!
    const regularYear = yearChips.find((c) => c.getAttribute('title')?.startsWith('Guardia 24h'))!
    expect(permitYear.textContent).toBe('P')
    expect(regularYear.textContent).toBe('G24')

    // A day with a single permit tag is wide enough to keep the icon.
    const wideIso = isoDate(daysOfYear(YEAR)[1])
    fillDay(container, wideIso)
    const wideChip = chipsOf(dayCell(container, wideIso))[0]
    expect(wideChip.textContent).toContain('🪪')
    expect(wideChip.textContent).toContain('P')

    // Month chips: same rule next to the label.
    fireEvent.click(container.querySelector('.month-col__zoom')!) // Enero
    const zoomChips = [...container.querySelectorAll('.zoom .tag-chip')] as HTMLElement[]
    const permitMonth = zoomChips.find((c) => c.getAttribute('title')?.startsWith('Permiso médico'))!
    const regularMonth = zoomChips.find(
      (c) => c.getAttribute('title')?.startsWith('Guardia 24h'),
    )!
    expect(permitMonth.textContent).toContain('🪪')
    expect(permitMonth.textContent).toContain('Permiso médico')
    expect(regularMonth.textContent).toContain('Guardia 24h')
    expect(regularMonth.textContent).not.toContain('🪪')
  })

  it('a holiday tag does not appear in the year and month statistics bars', () => {
    const { container } = renderApp()
    const iso = firstIso()

    // Create the holiday tag through the editor.
    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Puente' } })
    fireEvent.click(formCheckbox(container, 'Día Festivo')!)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // Apply it on a day, so it would be counted if it were included.
    const holidayPaletteChip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Puente'),
    )!
    fireEvent.click(holidayPaletteChip)
    fillDay(container, iso)
    expect(chipsOf(dayCell(container, iso))).toHaveLength(1)

    // Year bar: no row for the holiday tag, while regular tags are listed.
    const yearItems = [...container.querySelectorAll('.stats__item')]
    expect(yearItems.some((li) => li.textContent?.includes('Puente'))).toBe(false)
    expect(yearItems.some((li) => li.textContent?.includes('Guardia 24h'))).toBe(true)

    // Month bar (Enero): same rule.
    fireEvent.click(container.querySelector('.month-col__zoom')!) // Enero
    const zoomItems = [...container.querySelectorAll('.zoom__stats .stats__item')]
    expect(zoomItems.some((li) => li.textContent?.includes('Puente'))).toBe(false)
    expect(zoomItems.some((li) => li.textContent?.includes('Guardia 24h'))).toBe(true)
  })

  it('year and month bars show the permit group after the regular tags with the period count; holidays stay out', () => {
    const { container } = renderApp()
    const iso = firstIso()
    const iso2 = isoDate(daysOfYear(YEAR)[1])

    // Create a holiday tag (must stay out) and a permit tag.
    fireEvent.click(container.querySelector('.chip--add')!)
    let input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Puente' } })
    fireEvent.click(formCheckbox(container, 'Día Festivo')!)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    fireEvent.click(container.querySelector('.chip--add')!)
    input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Permiso médico' } })
    fireEvent.click(formCheckbox(container, 'Permiso de trabajo')!)
    fireEvent.change(formNumber(container, 'Máximo por año')!, { target: { value: '4' } })
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // Apply the permit on two days and the holiday on one.
    const paletteChip = (label: string) =>
      [...container.querySelectorAll('.palette .chip')].find((c) =>
        c.textContent?.includes(label),
      )
    fireEvent.click(paletteChip('Permiso médico')!)
    fillDay(container, iso)
    fillDay(container, iso2)
    fireEvent.click(paletteChip('Puente')!)
    fillDay(container, iso)

    // Year bar: regular tags first (planner order), then the permit group,
    // and the holiday row is absent.
    const labels = () =>
      [...container.querySelectorAll('.stats__item')].map((li) =>
        li.querySelector('.stats__label')?.textContent,
      )
    expect(labels()).toEqual([
      'Guardia 24h',
      'Guardia 17h',
      'Diurno 12h',
      'Nocturno 12h',
      'Turno 24h',
      'Permiso médico',
    ])
    const permitRow = [...container.querySelectorAll('.stats__item')].find((li) =>
      li.textContent?.includes('Permiso médico'),
    )!
    expect(permitRow.textContent).toContain('🪪')
    expect(permitRow.querySelector('.stats__count')?.textContent).toBe('2 de 4 · Restantes 2')
    expect(labels().some((l) => l === 'Puente')).toBe(false)

    // Month bar (Enero): same shape, count limited to the month (both applications).
    fireEvent.click(container.querySelector('.month-col__zoom')!) // Enero
    const zoomLabels = () =>
      [...container.querySelectorAll('.zoom__stats .stats__item')].map((li) =>
        li.querySelector('.stats__label')?.textContent,
      )
    expect(zoomLabels().at(-1)).toBe('Permiso médico')
    const zoomPermit = [...container.querySelectorAll('.zoom__stats .stats__item')].find((li) =>
      li.textContent?.includes('Permiso médico'),
    )!
    expect(zoomPermit.querySelector('.stats__count')?.textContent).toBe('2')
    // The max is yearly: no remaining counter in the month bar.
    expect(zoomPermit.textContent).not.toContain('Restantes')
    expect(zoomLabels().some((l) => l === 'Puente')).toBe(false)
  })

  it('negative remaining is highlighted in red and applications are never capped', () => {
    const { container } = renderApp()

    // Create a permit tag with a yearly max of 1.
    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Permiso médico' } })
    fireEvent.click(formCheckbox(container, 'Permiso de trabajo')!)
    fireEvent.change(formNumber(container, 'Máximo por año')!, { target: { value: '1' } })
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    // Apply it on two days: more applications than the max.
    const paletteChip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Permiso médico'),
    )!
    const iso = firstIso()
    fireEvent.click(paletteChip)
    fillDay(container, iso)
    fillDay(container, isoDate(daysOfYear(YEAR)[1]))

    // Both applications are counted; the remaining goes negative and is flagged.
    const permitRow = [...container.querySelectorAll('.stats__item')].find((li) =>
      li.textContent?.includes('Permiso médico'),
    )!
    const count = permitRow.querySelector('.stats__count')!
    expect(count.textContent).toBe('2 de 1 · Restantes -1')
    expect(count.className).toContain('stats__count--negative')
  })

  it('editing the max updates the year counter', () => {
    const { container } = renderApp()

    // Create a permit tag with a yearly max of 4 and apply it on one day.
    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Permiso médico' } })
    fireEvent.click(formCheckbox(container, 'Permiso de trabajo')!)
    fireEvent.change(formNumber(container, 'Máximo por año')!, { target: { value: '4' } })
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    const paletteChip = [...container.querySelectorAll('.palette .chip')].find((c) =>
      c.textContent?.includes('Permiso médico'),
    )!
    fireEvent.click(paletteChip)
    fillDay(container, firstIso())

    const count = () => {
      const row = [...container.querySelectorAll('.stats__item')].find((li) =>
        li.textContent?.includes('Permiso médico'),
      )!
      return row.querySelector('.stats__count')?.textContent
    }
    expect(count()).toBe('1 de 4 · Restantes 3')

    // Edit the max to 10: the counter follows without touching the days.
    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Permiso médico'),
    )!
    fireEvent.click(row.querySelectorAll('button')[0]) // ✏️
    fireEvent.change(formNumber(container, 'Máximo por año')!, { target: { value: '10' } })
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close

    expect(count()).toBe('1 de 10 · Restantes 9')
  })

  it('unchecking "Día Festivo" keeps the tag out of statistics until "Incluir en estadísticas" is re-checked', () => {
    const { container } = renderApp()
    const yearHasRow = () =>
      [...container.querySelectorAll('.stats__item')].some((li) =>
        li.textContent?.includes('Puente'),
      )

    // Create a holiday tag (statistics forced off) and close the editor.
    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Puente' } })
    fireEvent.click(formCheckbox(container, 'Día Festivo')!)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close
    expect(yearHasRow()).toBe(false)

    // Edit it: the holiday box loads checked, statistics loads unchecked+disabled.
    fireEvent.click(container.querySelector('.chip--add')!)
    const holidayRow = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Puente'),
    )!
    fireEvent.click(holidayRow.querySelectorAll('button')[0]) // ✏️
    const holiday = formCheckbox(container, 'Día Festivo')!
    const stats = formCheckbox(container, 'Incluir en estadísticas')!
    expect(holiday.checked).toBe(true)
    expect(stats.checked).toBe(false)
    expect(stats.disabled).toBe(true)

    // Uncheck the holiday box and save: the tag stays out of the statistics.
    fireEvent.click(holiday)
    expect(stats.disabled).toBe(false)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close
    expect(yearHasRow()).toBe(false)

    // Re-check "Incluir en estadísticas" and save: now it is counted again.
    fireEvent.click(container.querySelector('.chip--add')!)
    const editedRow = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Puente'),
    )!
    fireEvent.click(editedRow.querySelectorAll('button')[0]) // ✏️
    expect(formCheckbox(container, 'Día Festivo')!.checked).toBe(false)
    const statsAgain = formCheckbox(container, 'Incluir en estadísticas')!
    expect(statsAgain.checked).toBe(false)
    fireEvent.click(statsAgain)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close
    expect(yearHasRow()).toBe(true)
  })

  it('a holiday tag applies, renames and deletes like any other tag', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { container } = renderApp()
    const iso = firstIso()

    // Create the holiday tag.
    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Puente' } })
    fireEvent.click(formCheckbox(container, 'Día Festivo')!)
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close
    const paletteChip = () =>
      [...container.querySelectorAll('.palette .chip')].find((c) =>
        c.textContent?.includes('Puente'),
      )

    // Applies: select it in the palette and fill a day.
    fireEvent.click(paletteChip()!)
    fillDay(container, iso)
    const appliedChip = chipsOf(dayCell(container, iso))[0]
    expect(appliedChip.getAttribute('title')).toContain('Puente')

    // Renames: chip and palette follow, and the holiday icon stays.
    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Puente'),
    )!
    fireEvent.click(row.querySelectorAll('button')[0]) // ✏️
    fireEvent.change(container.querySelector('.tag-form input[type="text"]')!, {
      target: { value: 'Puente nuevo' },
    })
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close
    const renamedChip = chipsOf(dayCell(container, iso))[0]
    expect(renamedChip.getAttribute('title')).toContain('Puente nuevo')
    expect(renamedChip.textContent).toContain('🏖️')
    expect(paletteChip()?.textContent).toContain('Puente nuevo')

    // Deletes: remove it from the day (double click), then the tag itself.
    fireEvent.click(renamedChip)
    fireEvent.click(renamedChip) // second click inside the debounce window
    expect(chipsOf(dayCell(container, iso))).toHaveLength(0)
    fireEvent.click(container.querySelector('.chip--add')!)
    const renamedRow = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Puente nuevo'),
    )!
    fireEvent.click(renamedRow.querySelectorAll('button')[1]) // 🗑️
    expect(confirmSpy).toHaveBeenCalledWith('¿Eliminar la etiqueta “Puente nuevo”?')
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close
    expect(
      [...container.querySelectorAll('.palette .chip')].some((c) =>
        c.textContent?.includes('Puente nuevo'),
      ),
    ).toBe(false)
    vi.restoreAllMocks()
  })

  it('a permit tag applies, renames and deletes like any other tag', () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const { container } = renderApp()
    const iso = firstIso()

    // Create the permit tag.
    fireEvent.click(container.querySelector('.chip--add')!)
    const input = container.querySelector('.tag-form input[type="text"]') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'Permiso médico' } })
    fireEvent.click(formCheckbox(container, 'Permiso de trabajo')!)
    fireEvent.change(formNumber(container, 'Máximo por año')!, { target: { value: '4' } })
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close
    const paletteChip = (label: string) =>
      [...container.querySelectorAll('.palette .chip')].find((c) =>
        c.textContent?.includes(label),
      )

    // Applies: select it in the palette and fill a day.
    fireEvent.click(paletteChip('Permiso médico')!)
    fillDay(container, iso)
    const appliedChip = chipsOf(dayCell(container, iso))[0]
    expect(appliedChip.getAttribute('title')).toContain('Permiso médico')

    // Renames: chip and palette follow, and the permit icon stays.
    fireEvent.click(container.querySelector('.chip--add')!)
    const row = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Permiso médico'),
    )!
    fireEvent.click(row.querySelectorAll('button')[0]) // ✏️
    fireEvent.change(container.querySelector('.tag-form input[type="text"]')!, {
      target: { value: 'Permiso nuevo' },
    })
    fireEvent.click(container.querySelector('.tag-form button[type="submit"]')!)
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close
    const renamedChip = chipsOf(dayCell(container, iso))[0]
    expect(renamedChip.getAttribute('title')).toContain('Permiso nuevo')
    expect(renamedChip.textContent).toContain('🪪')
    expect(paletteChip('Permiso nuevo')?.textContent).toContain('Permiso nuevo')

    // Deletes: remove it from the day (double click), then the tag itself.
    fireEvent.click(renamedChip)
    fireEvent.click(renamedChip) // second click inside the debounce window
    expect(chipsOf(dayCell(container, iso))).toHaveLength(0)
    fireEvent.click(container.querySelector('.chip--add')!)
    const renamedRow = [...container.querySelectorAll('.tags-list__item')].find((li) =>
      li.textContent?.includes('Permiso nuevo'),
    )!
    fireEvent.click(renamedRow.querySelectorAll('button')[1]) // 🗑️
    expect(confirmSpy).toHaveBeenCalledWith('¿Eliminar la etiqueta “Permiso nuevo”?')
    fireEvent.click(container.querySelector('.modal__head .btn')!) // close
    expect(
      [...container.querySelectorAll('.palette .chip')].some((c) =>
        c.textContent?.includes('Permiso nuevo'),
      ),
    ).toBe(false)
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

describe('previous version', () => {
  it('shows a blocking notice for previous-version data and starts fresh only after confirming', () => {
    const legacy = JSON.stringify({ version: 1, planners: [] })
    localStorage.setItem('annual-planner:v1', legacy)

    const { container } = renderApp()

    // Blocking notice instead of the planner…
    const notice = container.querySelector('.previous-version')
    expect(notice).not.toBeNull()
    expect(notice?.textContent).toContain('versión anterior')
    expect(notice?.textContent).toContain('ya no son compatibles')
    expect(notice?.querySelector('button')?.textContent).toBe('Empezar de cero')
    expect(container.querySelector('.day[data-iso]')).toBeNull()
    // …and nothing has been written yet.
    expect(localStorage.getItem('annual-planner:v2')).toBeNull()

    fireEvent.click(notice!.querySelector('button')!)

    // A fresh default planner appears only now…
    expect(container.querySelector('.previous-version')).toBeNull()
    expect(container.querySelector('.day[data-iso]')).not.toBeNull()
    // …saved under the v2 key, with the old entry untouched.
    const stored = localStorage.getItem('annual-planner:v2')
    expect(stored).not.toBeNull()
    expect(JSON.parse(stored!).version).toBe(2)
    expect(localStorage.getItem('annual-planner:v1')).toBe(legacy)
  })

  it('importing a previous-version file alerts the specific message and keeps planners unchanged', async () => {
    const { container } = renderApp()
    fillDay(container, firstIso()) // current data worth protecting
    expect(chipsOf(dayCell(container, firstIso()))).toHaveLength(1)

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const file = new File(
      [JSON.stringify({ version: 1, planners: [] })],
      'planificadores-0.2.0.json',
      { type: 'application/json' },
    )
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(input, 'files', { value: [file], configurable: true })
    fireEvent.change(input)

    await waitFor(() =>
      expect(alertSpy).toHaveBeenCalledWith(
        'El archivo es de una versión anterior y ya no es compatible.',
      ),
    )
    // Refused before any merge: no confirmation asked, planners unchanged.
    expect(confirmSpy).not.toHaveBeenCalled()
    expect(container.querySelectorAll('.panel__item')).toHaveLength(1)
    expect(chipsOf(dayCell(container, firstIso()))).toHaveLength(1)

    vi.restoreAllMocks()
  })
})
