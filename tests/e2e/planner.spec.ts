import fs from 'node:fs'
import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

/**
 * Click a day's empty area (just right of the number, never on it: the
 * number opens the day detail modal) = apply the active tag.
 */
async function fillDay(page: Page, day: Locator) {
  const number = await day.locator('.day__number').boundingBox()
  if (!number) throw new Error('The day number is not on screen')
  await page.mouse.click(number.x + number.width + 8, number.y + number.height / 2)
}

/**
 * End-to-end smoke test of the whole app, ported from the original
 * 44-check script. One serial flow (state carries across sections).
 */
test('annual planner: full flow', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  // Every confirm() of the run (import…) is accepted and recorded.
  const dialogs: string[] = []
  page.on('dialog', (d) => {
    dialogs.push(d.message())
    void d.accept()
  })

  await test.step('1. Load & defaults', async () => {
    await page.goto('/', { waitUntil: 'networkidle' })
    expect(await page.title()).toBe('Planificador anual')
    await expect(page.locator('.month-col')).toHaveCount(12)

    const dayCount = await page.locator('.day[data-iso]').count()
    expect(dayCount === 365 || dayCount === 366).toBe(true)

    // No tag is selected by default: a click on a day shows its detail.
    await expect(page.locator('.chip--on')).toHaveCount(0)
    const firstDay = page.locator('.day[data-iso]').first()
    await fillDay(page, firstDay)
    await expect(page.locator('.modal--day-detail')).toHaveCount(1)
    await expect(page.locator('.day-detail__empty')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(page.locator('.modal--day-detail')).toHaveCount(0)
    await expect(firstDay.locator('.tag-chip')).toHaveCount(0)

    await expect(page.locator('.stats__year')).toHaveCount(1)
    expect(await page.locator('.stats__year').innerText()).toMatch(/^\d{4}$/)
  })

  await test.step('1b. About modal shows the app version', async () => {
    const pkg = JSON.parse(
      fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    ) as { version: string }

    await page.locator('.topbar .btn--icon').click()
    await expect(page.locator('.modal--about')).toHaveCount(1)
    await expect(page.locator('.about__version')).toContainText(`Versión ${pkg.version}`)

    await page.keyboard.press('Escape')
    await expect(page.locator('.modal--about')).toHaveCount(0)
  })

  await test.step('1c. PWA: manifest, icons and service worker', async () => {
    const manifest = await page.evaluate(async () => {
      const link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]')
      if (!link) return null
      const res = await fetch(link.href)
      return {
        status: res.status,
        contentType: res.headers.get('content-type'),
        json: (await res.json()) as { name: string; icons: { sizes: string }[] },
      }
    })
    expect(manifest?.status).toBe(200)
    expect(manifest?.contentType).toContain('manifest+json')
    expect(manifest?.json.name).toBe('Planificador anual')
    expect(manifest?.json.icons.map((i) => i.sizes)).toEqual(['192x192', '512x512'])

    // localhost is a secure context, so the worker registers and controls the page.
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null)
    expect(await page.evaluate(() => fetch('/sw.js').then((r) => r.status))).toBe(200)
  })

  await test.step('2. Fill days with one click', async () => {
    // Pick a tag first: nothing is selected by default.
    await page.locator('.palette .chip', { hasText: 'Guardia 24h' }).click()
    await expect(page.locator('.chip--on', { hasText: 'Guardia 24h' })).toHaveCount(1)

    const firstDay = page.locator('.day[data-iso]').first()
    await fillDay(page, firstDay)
    await expect(firstDay.locator('.tag-chip')).toHaveCount(1)

    // second tag on same day (switch tag first)
    await page.locator('.palette .chip', { hasText: 'Festivo nacional' }).click()
    await fillDay(page, firstDay)
    await expect(firstDay.locator('.tag-chip')).toHaveCount(2)

    // third tag must be rejected
    await page.locator('.palette .chip', { hasText: 'Diurno 12h' }).click()
    await fillDay(page, firstDay)
    await expect(firstDay.locator('.tag-chip')).toHaveCount(2)
    await expect(page.locator('.toast')).toHaveCount(1)
    await expect(page.locator('.toast')).toHaveCount(0, { timeout: 4000 }) // auto-hides
  })

  const firstDay = page.locator('.day[data-iso]').first()

  await test.step('3. One click opens the detail modal; double click removes', async () => {
    const chip = firstDay.locator('.tag-chip').first()

    // One click → little modal with every detail of the application
    await chip.click()
    await expect(page.locator('.modal--tag-detail')).toHaveCount(1)
    await expect(page.locator('.tag-detail__title')).toContainText('Guardia 24h')

    // Edit the subtitle of this application
    await page.locator('.tag-detail__form input').fill('de tarde')
    await page.locator('.tag-detail__form button[type="submit"]').click()
    await expect(page.locator('.modal--tag-detail')).toHaveCount(0)
    await expect(chip).toHaveAttribute('title', /de tarde/)

    // Double click removes it directly (no modal)
    await chip.dblclick()
    await expect(firstDay.locator('.tag-chip')).toHaveCount(1)
    await expect(page.locator('.modal--tag-detail')).toHaveCount(0)
  })

  await test.step('3b. Press and hold removes a chip (touch)', async () => {
    const day = page.locator('.day[data-iso]').nth(10)
    await fillDay(page, day) // apply the active tag
    await expect(day.locator('.tag-chip')).toHaveCount(1)

    const chip = day.locator('.tag-chip').first()
    await chip.hover()
    await page.mouse.down()
    await page.waitForTimeout(750) // longer than the 600ms hold
    await page.mouse.up()

    await expect(day.locator('.tag-chip')).toHaveCount(0)
    await expect(page.locator('.modal--tag-detail')).toHaveCount(0)
    // The release click must not land on the day and fill it again
    await expect(day.locator('.tag-chip')).toHaveCount(0)
  })

  await test.step('3c. The day number opens the day detail modal', async () => {
    // A filled day: every tag of the day is listed in full.
    await firstDay.locator('.day__number').click()
    await expect(page.locator('.modal--day-detail')).toHaveCount(1)
    await expect(page.locator('.day-detail__label')).toContainText('Festivo nacional')
    await expect(page.locator('.modal--day-detail')).toContainText(/de enero de \d{4}/)
    await page.keyboard.press('Escape')
    await expect(page.locator('.modal--day-detail')).toHaveCount(0)
    await expect(firstDay.locator('.tag-chip')).toHaveCount(1) // the day is untouched

    // An empty day shows the empty state, and the click fills nothing.
    const emptyDay = page.locator('.day[data-iso]').nth(11)
    await emptyDay.locator('.day__number').click()
    await expect(page.locator('.day-detail__empty')).toHaveCount(1)
    await page.keyboard.press('Escape')
    await expect(emptyDay.locator('.tag-chip')).toHaveCount(0)
  })

  await test.step('4. Stats update', async () => {
    // Fill a day with the active (counted) tag so a count actually updates…
    await fillDay(page, page.locator('.day[data-iso]').nth(20)) // Diurno 12h
    const statsText = await page.locator('.planner .stats').innerText()
    expect(statsText).toMatch(/Diurno 12h\s*\n?\s*1/)
    // …while the holiday applied on day 1 stays out of the bars.
    expect(statsText).not.toContain('Festivo nacional')
  })

  await test.step('4b. Year chips always show text', async () => {
    await page.locator('.palette .chip', { hasText: 'Guardia 24h' }).click()
    const day = page.locator('.day[data-iso]').nth(12)
    await fillDay(page, day)

    // A single tag without subtitle shows the full name (plain tag: no icon).
    await expect(day.locator('.tag-chip__label')).toBeVisible()
    await expect(day.locator('.tag-chip__label')).toHaveText('Guardia 24h')
    await expect(day.locator('.tag-chip__acro')).toBeHidden()
    await expect(day.locator('.tag-chip__icon')).toHaveCount(0) // plain tag

    // The subtitle takes the room: acronym (never ellipsised) + "(subtitle)".
    await day.locator('.tag-chip').click()
    await expect(page.locator('.modal--tag-detail')).toHaveCount(1)
    await page.locator('.tag-detail__form input').fill('Titular: Juanfran')
    await page.locator('.tag-detail__form button[type="submit"]').click()
    await expect(page.locator('.modal--tag-detail')).toHaveCount(0)
    await expect(day.locator('.tag-chip')).toHaveText('G24(Titular: Juanfran)')
    await expect(day.locator('.tag-chip__label')).toHaveCount(0) // no room for it

    // Two tags: both chips become acronym-only dots (no icon, no subtitle).
    await page.locator('.palette .chip', { hasText: 'Diurno 12h' }).click()
    await fillDay(page, day)
    await expect(day.locator('.tag-chip')).toHaveCount(2)
    await expect(day.locator('.tag-chip__acro').first()).toHaveText('G24')
    await expect(day.locator('.tag-chip__acro').nth(1)).toHaveText('D12')
    await expect(day.locator('.tag-chip__icon')).toHaveCount(0)
    await expect(day.locator('.tag-chip__sub')).toHaveCount(0)
  })

  await test.step('5. Month zoom overlaps year view', async () => {
    await page.locator('.month-col__zoom', { hasText: 'Enero' }).click()
    await expect(page.locator('.zoom')).toHaveCount(1)
    await expect(page.locator('.zoom__dow')).toHaveCount(7)
    expect((await page.locator('.zoom__title').innerText()).toLowerCase()).toContain('enero')
    await expect(page.locator('.zoom__stats')).toHaveCount(1)
    // Wide screens: the full name fits on the top line of the chip…
    const zoomChip = page.locator('.zoom .tag-chip').first()
    await expect(zoomChip.locator('.tag-chip__label')).toBeVisible()
    await expect(zoomChip.locator('.tag-chip__label')).toHaveText('Festivo nacional')
    await expect(zoomChip.locator('.tag-chip__acro')).toBeHidden()

    // …and a subtitle gives it its second line: label + "(subtitle)".
    await zoomChip.click()
    await expect(page.locator('.modal--tag-detail')).toHaveCount(1)
    await page.locator('.tag-detail__form input').fill('de tarde')
    await page.locator('.tag-detail__form button[type="submit"]').click()
    await expect(page.locator('.modal--tag-detail')).toHaveCount(0)

    await expect(zoomChip.locator('.tag-chip__label')).toBeVisible()
    await expect(zoomChip.locator('.tag-chip__label')).toHaveText('Festivo nacional')
    await expect(zoomChip.locator('.tag-chip__sub')).toHaveText('(de tarde)')
    await expect(zoomChip.locator('.tag-chip__acro')).toBeHidden()
    await testInfo.attach('month-zoom.png', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })

    // navigate between months (stays within the year)
    await expect(page.locator('.zoom__bar .btn', { hasText: '◀ Diciembre' })).toBeDisabled()
    await page.locator('.zoom__bar .btn', { hasText: 'Febrero ▶' }).click()
    expect((await page.locator('.zoom__title').innerText()).toLowerCase()).toContain('febrero')
    await page.locator('.zoom__bar .btn', { hasText: '◀ Enero' }).click()
    expect((await page.locator('.zoom__title').innerText()).toLowerCase()).toContain('enero')

    // fill inside zoom
    const zoomDay = page.locator('.zoom .day[data-iso]').first()
    const before = await zoomDay.locator('.tag-chip').count()
    await fillDay(page, zoomDay)
    await expect(zoomDay.locator('.tag-chip')).toHaveCount(before + 1)

    await page.locator('.zoom .zoom__bar .btn', { hasText: 'Volver al año' }).click()
    await expect(page.locator('.zoom')).toHaveCount(0)
  })

  await test.step('6. Persistence (localStorage)', async () => {
    await fillDay(page, page.locator('.day[data-iso]').nth(3))
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.locator('.day[data-iso]').nth(3).locator('.tag-chip')).toHaveCount(1)
    const stored = await page.evaluate(() => localStorage.getItem('annual-planner:v2'))
    expect(stored).toContain('"version":2')
  })

  await test.step('7. Tags editor: create → apply → rename', async () => {
    await page.locator('.chip--add').click()
    await expect(page.locator('.modal')).toHaveCount(1)
    await expect(page.locator('.modal select')).toHaveCount(0) // no type field

    // Create a tag with a name and a color
    await page.locator('.tag-form input[type="text"]').fill('Prueba tag')
    await page.locator('[aria-label="Color #0891b2"]').click()
    await page.locator('.tag-form button[type="submit"]').click()
    await expect(page.locator('.tags-list__item', { hasText: 'Prueba tag' })).toHaveCount(1)
    await testInfo.attach('tags-editor.png', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
    await page.locator('.modal__head .btn').click()
    await expect(page.locator('.modal')).toHaveCount(0)
    await expect(page.locator('.palette .chip', { hasText: 'Prueba tag' })).toHaveCount(1)

    // Apply it to a free day
    await page.locator('.palette .chip', { hasText: 'Prueba tag' }).click()
    const tagDay = page.locator('.day[data-iso]').nth(4)
    await fillDay(page, tagDay)
    await expect(tagDay.locator('.tag-chip')).toHaveCount(1)
    await expect(tagDay.locator('.tag-chip')).toHaveAttribute('title', /^Prueba tag/)

    // Rename it: the palette, the day chip and the detail view follow
    await page.locator('.chip--add').click()
    await page
      .locator('.tags-list__item', { hasText: 'Prueba tag' })
      .locator('button')
      .first()
      .click()
    await page.locator('.tag-form input[type="text"]').fill('Prueba renombrada')
    await page.locator('.tag-form button[type="submit"]').click()
    await expect(page.locator('.tags-list__item', { hasText: 'Prueba renombrada' })).toHaveCount(1)
    await page.locator('.modal__head .btn').click()
    await expect(page.locator('.palette .chip', { hasText: 'Prueba renombrada' })).toHaveCount(1)
    await expect(tagDay.locator('.tag-chip')).toHaveAttribute('title', /^Prueba renombrada/)

    await tagDay.locator('.tag-chip').click()
    await expect(page.locator('.tag-detail__title')).toContainText('Prueba renombrada')
    await page.keyboard.press('Escape')
    await expect(page.locator('.modal--tag-detail')).toHaveCount(0)

    // Deleting the in-use tag is blocked with a usage-count toast (no confirm)
    await page.locator('.chip--add').click()
    await page
      .locator('.tags-list__item', { hasText: 'Prueba renombrada' })
      .locator('button')
      .nth(1)
      .click()
    await expect(page.locator('.toast')).toContainText('Prueba renombrada')
    await expect(page.locator('.toast')).toContainText('1 día')
    expect(dialogs.some((m) => m.includes('Prueba renombrada'))).toBe(false)
    await expect(page.locator('.tags-list__item', { hasText: 'Prueba renombrada' })).toHaveCount(1)
    await page.locator('.modal__head .btn').click()
    await expect(tagDay.locator('.tag-chip')).toHaveCount(1) // still applied
  })

  await test.step('7b. A label that does not fit is replaced by its acronym', async () => {
    // Rename it to a name too long for any chip (the editor allows 40 chars):
    // at both sizes it is wider than the room the chip has for it.
    const longName = 'Festivo Nacional Comunidad Autónoma' // 35 chars → FNCA
    await page.locator('.chip--add').click()
    await page
      .locator('.tags-list__item', { hasText: 'Prueba renombrada' })
      .locator('button')
      .first()
      .click()
    await page.locator('.tag-form input[type="text"]').fill(longName)
    await page.locator('.tag-form button[type="submit"]').click()
    await expect(page.locator('.tags-list__item', { hasText: longName })).toHaveCount(1)
    await page.locator('.modal__head .btn').click()

    // Year bar: the acronym takes the line over, the name is not clipped.
    const tagDay = page.locator('.day[data-iso]').nth(4)
    await expect(tagDay.locator('.tag-chip__label')).toBeHidden()
    await expect(tagDay.locator('.tag-chip__acro')).toBeVisible()
    await expect(tagDay.locator('.tag-chip__acro')).toHaveText('FNCA')

    // Month zoom: the top line of the chip abridges the same way.
    const iso = await tagDay.getAttribute('data-iso')
    await page.locator('.month-col__zoom', { hasText: 'Enero' }).click()
    const zoomChip = page.locator(`.zoom .day[data-iso="${iso}"] .tag-chip`)
    await expect(zoomChip.locator('.tag-chip__label')).toBeHidden()
    await expect(zoomChip.locator('.tag-chip__acro')).toBeVisible()
    await expect(zoomChip.locator('.tag-chip__acro')).toHaveText('FNCA')
    await page.locator('.zoom .zoom__bar .btn', { hasText: 'Volver al año' }).click()
    await expect(page.locator('.zoom')).toHaveCount(0)
  })

  await test.step('8. Archive: read-only', async () => {
    await page.locator('.topbar .status').click() // archivar
    expect(await page.locator('.topbar .status').innerText()).toContain('Archivado')

    const someDay = page.locator('.day[data-iso]').nth(5)
    const beforeArch = await someDay.locator('.tag-chip').count()
    await fillDay(page, someDay) // read-only: a day click opens the detail
    await expect(page.locator('.modal--day-detail')).toHaveCount(1)
    await expect(someDay.locator('.tag-chip')).toHaveCount(beforeArch)
    await page.keyboard.press('Escape')
    await expect(page.locator('.modal--day-detail')).toHaveCount(0)
    await expect(page.locator('.palette .chip--add')).toBeDisabled()
    await testInfo.attach('archived.png', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })

    await page.locator('.topbar .status').click() // reabrir
    expect(await page.locator('.topbar .status').innerText()).toContain('Activo')
  })

  await test.step('9. Create a second planner', async () => {
    await page.locator('.panel__new').click()
    await page.locator('.panel__create input[type="number"]').fill('2030')
    await page.locator('.panel__create button[type="submit"]').click()
    await expect(page.locator('.panel__item')).toHaveCount(2)
    expect(await page.locator('.topbar__title').innerText()).toContain('2030')
    const newYearDays = await page.locator('.day[data-iso]').count()
    expect(newYearDays >= 365).toBe(true)

    // go back to the first
    await page.locator('.panel__year').first().click()
    expect(await page.locator('.topbar__title').innerText()).not.toContain('2030')
  })

  await test.step('10. Export / import JSON', async () => {
    const imported = await page.evaluate(() => localStorage.getItem('annual-planner:v2'))
    expect(await page.locator('.topbar .btn', { hasText: 'Importar' }).count()).toBe(1)

    // Feed the stored payload back through the hidden file input
    const payload = JSON.stringify({ version: 2, planners: JSON.parse(imported ?? '{}').planners })
    const file = testInfo.outputPath('export.json')
    fs.writeFileSync(file, payload)

    await page.locator('input[type="file"]').setInputFiles(file)
    await expect(page.locator('.panel__item')).toHaveCount(2, { timeout: 5000 })
    expect(dialogs.some((m) => m.includes('importar'))).toBe(true)
  })

  await test.step('11. Print rules (A4 / A5)', async () => {
    // stub print so the dialog does not block the test
    await page.evaluate(() => {
      ;(window as unknown as Record<string, unknown>).__printed = false
      window.print = () => {
        ;(window as unknown as Record<string, unknown>).__printed = true
      }
    })
    await page.locator('.topbar .btn', { hasText: 'PDF A4' }).click()
    const a4 = await page.evaluate(() => ({
      printed: (window as unknown as Record<string, unknown>).__printed === true,
      rule: [...document.head.querySelectorAll('style')].map((s) => s.textContent).join(' '),
      paper: document.body.dataset.paper,
    }))
    expect(a4.printed).toBe(true)
    expect(a4.rule).toContain('size: A4 landscape')
    expect(a4.paper).toBe('A4')

    await page.locator('.topbar .btn', { hasText: 'PDF A5' }).click()
    const a5 = await page.evaluate(() => ({
      rule: [...document.head.querySelectorAll('style')].map((s) => s.textContent).join(' '),
      paper: document.body.dataset.paper,
    }))
    expect(a5.rule).toContain('size: A5 landscape')
    expect(a5.paper).toBe('A5')
  })

  await test.step('12. No JS errors during the whole run', async () => {
    await testInfo.attach('year-view.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
    expect(errors).toEqual([])
  })
})

/** Every day cell of the open month must be on screen and the grid must not scroll. */
async function expectMonthFits(page: Page, width: number, height: number) {
  const rects = await page.locator('.zoom .day').evaluateAll((days) =>
    days.map((day) => {
      const r = day.getBoundingClientRect()
      return { top: r.top, bottom: r.bottom, left: r.left, right: r.right }
    }),
  )
  expect(rects.length).toBeGreaterThan(28)
  for (const r of rects) {
    expect(r.top).toBeGreaterThanOrEqual(-1)
    expect(r.left).toBeGreaterThanOrEqual(-1)
    expect(r.bottom).toBeLessThanOrEqual(height + 1)
    expect(r.right).toBeLessThanOrEqual(width + 1)
  }
  const gridScrolls = await page
    .locator('.zoom__grid')
    .evaluate((grid) => grid.scrollHeight > grid.clientHeight + 1)
  expect(gridScrolls).toBe(false)
}

/** Horizontal drag over the zoom: to the left = next month, to the right = previous. */
async function dragAcrossZoom(page: Page, dx: number, dayIndex = 15) {
  const box = await page.locator('.zoom .day[data-iso]').nth(dayIndex).boundingBox()
  if (!box) throw new Error('The day cell is not on screen')
  const x = box.x + box.width / 2
  const y = box.y + Math.min(8, box.height / 2)
  await page.mouse.move(x, y)
  await page.mouse.down()
  await page.mouse.move(x + dx, y, { steps: 5 })
  await page.mouse.up()
}

test('month zoom on a phone: portrait and landscape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/', { waitUntil: 'networkidle' })

  // Nothing is selected by default: pick the tag the checks below apply.
  // (Do it before the zoom, whose overlay covers the palette.)
  await page.locator('.palette .chip', { hasText: 'Guardia 24h' }).click()
  await expect(page.locator('.chip--on', { hasText: 'Guardia 24h' })).toHaveCount(1)
  await page.locator('.month-col__zoom', { hasText: 'Enero' }).click()
  await expect(page.locator('.zoom')).toHaveCount(1)

  await test.step('portrait: the month and both panels fit without scrolling', async () => {
    await expectMonthFits(page, 390, 844)
    await expect(page.locator('.zoom__bar')).toBeInViewport()
    await expect(page.locator('.zoom__stats')).toBeInViewport()
  })

  await test.step('portrait: a lateral drag moves to the neighbouring month', async () => {
    const chips = await page.locator('.zoom .tag-chip').count()
    await dragAcrossZoom(page, -70)
    expect((await page.locator('.zoom__title').innerText()).toLowerCase()).toContain('febrero')
    await dragAcrossZoom(page, 70)
    expect((await page.locator('.zoom__title').innerText()).toLowerCase()).toContain('enero')
    // The swipe must not leave a day filled behind it
    expect(await page.locator('.zoom .tag-chip').count()).toBe(chips)
  })

  await test.step('portrait: one-line chips show the acronym, the number opens the detail', async () => {
    // A filled day: the chip collapses to a single line — the label and the
    // subtitle are dropped, the acronym takes their place.
    const day = page.locator('.zoom .day[data-iso]').nth(5)
    await fillDay(page, day)
    await expect(day.locator('.tag-chip')).toHaveCount(1)
    await expect(day.locator('.tag-chip__label')).toBeHidden()
    await expect(day.locator('.tag-chip__sub')).toBeHidden()
    await expect(day.locator('.tag-chip__acro')).toBeVisible()
    await expect(day.locator('.tag-chip__acro')).toHaveText('G24')

    // …and the day number shows them in full inside the modal.
    await day.locator('.day__number').click()
    await expect(page.locator('.modal--day-detail')).toHaveCount(1)
    await expect(page.locator('.day-detail__label')).toContainText('Guardia 24h')
    // The ✕ closes only the modal (Escape would also leave the zoom).
    await page.locator('.modal--day-detail .modal__head .btn').click()
    await expect(page.locator('.modal--day-detail')).toHaveCount(0)
    await expect(page.locator('.zoom')).toHaveCount(1)

    // The number click must not have filled or emptied anything.
    await expect(day.locator('.tag-chip')).toHaveCount(1)
  })

  await page.setViewportSize({ width: 812, height: 375 })

  await test.step('landscape: all rows fit; the panels are reached by scrolling', async () => {
    await expectMonthFits(page, 812, 375)

    const zoom = page.locator('.zoom')
    const statsTop = () =>
      page.locator('.zoom__stats').evaluate((el) => el.getBoundingClientRect().top)

    // The overlay scrolls: the stats panel waits below the fold…
    expect(await zoom.evaluate((el) => el.scrollHeight > el.clientHeight + 1)).toBe(true)
    expect(await statsTop()).toBeGreaterThanOrEqual(374)

    await zoom.evaluate((el) => el.scrollTo(0, el.scrollHeight))
    await expect(page.locator('.zoom__stats')).toBeInViewport()

    // …and back at the top the bar is there again, with the panel below.
    await zoom.evaluate((el) => el.scrollTo(0, 0))
    await expect(page.locator('.zoom__bar')).toBeInViewport()
    expect(await statsTop()).toBeGreaterThanOrEqual(374)
  })

  await test.step('landscape: one-line chips show the acronym + the subtitle', async () => {
    const day = page.locator('.zoom .day[data-iso]').nth(5)
    await expect(day.locator('.tag-chip__acro')).toBeVisible()
    await expect(day.locator('.tag-chip__acro')).toHaveText('G24')
    await expect(day.locator('.tag-chip__label')).toBeHidden()

    // The subtitle joins the acronym on a cell wide enough to hold it.
    await day.locator('.tag-chip').click()
    await expect(page.locator('.modal--tag-detail')).toHaveCount(1)
    await page.locator('.tag-detail__form input').fill('Titular: Juanfran')
    await page.locator('.tag-detail__form button[type="submit"]').click()
    await expect(page.locator('.modal--tag-detail')).toHaveCount(0)

    await expect(day.locator('.tag-chip__sub')).toBeVisible()
    await expect(day.locator('.tag-chip__sub')).toHaveText('(Titular: Juanfran)')
    await expect(day.locator('.tag-chip__acro')).toHaveText('G24')
  })

  await test.step('landscape: the same lateral drag moves to the next month', async () => {
    await dragAcrossZoom(page, -70)
    expect((await page.locator('.zoom__title').innerText()).toLowerCase()).toContain('febrero')
  })
})
