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

/** Checkbox of the tag form whose label contains the given text. */
function formCheckbox(container: HTMLElement, labelText: string): HTMLInputElement | null {
  const label = [...container.querySelectorAll('.tag-form label')].find((l) =>
    l.textContent?.includes(labelText),
  )
  return label?.querySelector('input[type="checkbox"]') ?? null
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
      version: 1,
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
    localStorage.setItem('annual-planner:v1', JSON.stringify(oldData))

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
    // jsdom serializes #db2777 as rgb() in the style attribute.
    expect(row!.querySelector('.stats__swatch')!.getAttribute('style')).toContain(
      'rgb(219, 39, 119)',
    )

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
    expect(row!.querySelector('.stats__swatch')!.getAttribute('style')).toContain(
      'rgb(219, 39, 119)',
    )
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

    // Year chips: the holiday chip shows the icon, the regular one stays empty
    // (titles keep the plain label, no icon — tooltips are unaffected).
    const yearChips = chipsOf(dayCell(container, iso))
    expect(yearChips).toHaveLength(2)
    const holidayYear = yearChips.find((c) => c.getAttribute('title')?.startsWith('Puente'))!
    const regularYear = yearChips.find((c) => c.getAttribute('title')?.startsWith('Guardia 24h'))!
    expect(holidayYear.textContent).toContain('🏖️')
    expect(regularYear.textContent).toBe('')

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
