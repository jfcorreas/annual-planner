import fs from 'node:fs'
import { expect, test } from '@playwright/test'

/**
 * End-to-end smoke test of the whole app, ported from the original
 * 44-check script. One serial flow (state carries across sections).
 */
test('annual planner: full flow', async ({ page }, testInfo) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  // Every confirm() of the run (type deletion, import…) is accepted and recorded.
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

    await expect(page.locator('.chip--on', { hasText: 'Guardia 24h' })).toHaveCount(1)
    await expect(page.locator('.stats__year')).toHaveCount(1)
    expect(await page.locator('.stats__year').innerText()).toMatch(/^\d{4}$/)
  })

  await test.step('2. Fill days with one click', async () => {
    const firstDay = page.locator('.day[data-iso]').first()
    await firstDay.locator('.day__number').click() // number area = fill
    await expect(firstDay.locator('.tag-chip')).toHaveCount(1)

    // second tag on same day (switch tag first)
    await page.locator('.palette .chip', { hasText: 'Festivo nacional' }).click()
    await firstDay.locator('.day__number').click()
    await expect(firstDay.locator('.tag-chip')).toHaveCount(2)

    // third tag must be rejected
    await page.locator('.palette .chip', { hasText: 'Diurno 12h' }).click()
    await firstDay.locator('.day__number').click()
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
    await expect(page.locator('.tag-detail__meta')).toContainText('Trabajo')

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
    await day.locator('.day__number').click() // apply the active tag
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

  await test.step('4. Stats update', async () => {
    const statsText = await page.locator('.planner .stats__list').innerText()
    expect(statsText).toMatch(/Festivo nacional\s*\n?\s*1/)
  })

  await test.step('5. Month zoom overlaps year view', async () => {
    await page.locator('.month-col__zoom', { hasText: 'Enero' }).click()
    await expect(page.locator('.zoom')).toHaveCount(1)
    await expect(page.locator('.zoom__dow')).toHaveCount(7)
    expect((await page.locator('.zoom__title').innerText()).toLowerCase()).toContain('enero')
    await expect(page.locator('.zoom__stats')).toHaveCount(1)
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
    await zoomDay.locator('.day__number').click()
    await expect(zoomDay.locator('.tag-chip')).toHaveCount(before + 1)

    await page.locator('.zoom .zoom__bar .btn', { hasText: 'Volver al año' }).click()
    await expect(page.locator('.zoom')).toHaveCount(0)
  })

  await test.step('6. Clear day mode', async () => {
    await page.locator('.chip--clear').click()
    await expect(page.locator('.chip--clear.chip--on')).toHaveCount(1)
    await firstDay.locator('.day__number').click()
    await expect(firstDay.locator('.tag-chip')).toHaveCount(0)
    await page.locator('.chip--clear').click() // leave clear mode
  })

  await test.step('7. Persistence (localStorage)', async () => {
    await page.locator('.day[data-iso]').nth(3).locator('.day__number').click()
    await page.reload({ waitUntil: 'networkidle' })
    await expect(page.locator('.day[data-iso]').nth(3).locator('.tag-chip')).toHaveCount(1)
    const stored = await page.evaluate(() => localStorage.getItem('annual-planner:v1'))
    expect(stored).toContain('"version":1')
  })

  await test.step('8. Tags editor: manage types and create a tag', async () => {
    await page.locator('.chip--add').click()
    await expect(page.locator('.modal')).toHaveCount(1)

    // Add a new type and see it offered in the "Tipo" select
    await page.locator('.types-editor__form input[type="text"]').fill('Comunidad')
    await page.locator('.types-editor__form button[type="submit"]').click()
    await expect(page.locator('.types-list__item')).toHaveCount(5)
    await expect(page.locator('.tag-form select option', { hasText: 'Comunidad' })).toHaveCount(1)

    // Rename it
    await page
      .locator('.types-list__item', { hasText: 'Comunidad' })
      .locator('button')
      .first()
      .click()
    await page.locator('.types-editor__form input[type="text"]').fill('Comunidad autónoma')
    await page.locator('.types-editor__form button[type="submit"]').click()
    await expect(
      page.locator('.types-list__item', { hasText: 'Comunidad autónoma' }),
    ).toHaveCount(1)

    // Deleting a type in use is blocked with an explanatory toast
    await page
      .locator('.types-list__item', { hasText: 'Trabajo' })
      .locator('button')
      .nth(1)
      .click()
    await expect(page.locator('.types-list__item')).toHaveCount(5)
    await expect(page.locator('.toast', { hasText: 'lo usan 5 etiquetas' })).toHaveCount(1)
    expect(dialogs.some((m) => m.includes('Eliminar el tipo'))).toBe(true)

    // An unused type can be deleted
    await page
      .locator('.types-list__item', { hasText: 'Comunidad autónoma' })
      .locator('button')
      .nth(1)
      .click()
    await expect(page.locator('.types-list__item')).toHaveCount(4)

    // Create a tag as before
    await page.locator('.tag-form input[type="text"]').fill('Prueba tag')
    await page.locator('.tag-form button[type="submit"]').click()
    await expect(page.locator('.tags-list__item', { hasText: 'Prueba tag' })).toHaveCount(1)
    await testInfo.attach('tags-editor.png', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })
    await page.locator('.modal__head .btn').click()
    await expect(page.locator('.modal')).toHaveCount(0)
    await expect(page.locator('.palette .chip', { hasText: 'Prueba tag' })).toHaveCount(1)
  })

  await test.step('9. Archive: read-only', async () => {
    await page.locator('.topbar .status').click() // archivar
    expect(await page.locator('.topbar .status').innerText()).toContain('Archivado')

    const someDay = page.locator('.day[data-iso]').nth(5)
    const beforeArch = await someDay.locator('.tag-chip').count()
    await someDay.locator('.day__number').click({ force: true })
    await expect(someDay.locator('.tag-chip')).toHaveCount(beforeArch)
    await expect(page.locator('.palette .chip--clear')).toBeDisabled()
    await testInfo.attach('archived.png', {
      body: await page.screenshot(),
      contentType: 'image/png',
    })

    await page.locator('.topbar .status').click() // reabrir
    expect(await page.locator('.topbar .status').innerText()).toContain('Activo')
  })

  await test.step('10. Create a second planner', async () => {
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

  await test.step('11. Export / import JSON', async () => {
    const imported = await page.evaluate(() => localStorage.getItem('annual-planner:v1'))
    expect(await page.locator('.topbar .btn', { hasText: 'Importar' }).count()).toBe(1)

    // Feed the stored payload back through the hidden file input
    const payload = JSON.stringify({ version: 1, planners: JSON.parse(imported ?? '{}').planners })
    const file = testInfo.outputPath('export.json')
    fs.writeFileSync(file, payload)

    await page.locator('input[type="file"]').setInputFiles(file)
    await expect(page.locator('.panel__item')).toHaveCount(2, { timeout: 5000 })
    expect(dialogs.some((m) => m.includes('importar'))).toBe(true)
  })

  await test.step('12. Print rules (A4 / A5)', async () => {
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

  await test.step('13. No JS errors during the whole run', async () => {
    await testInfo.attach('year-view.png', {
      body: await page.screenshot({ fullPage: true }),
      contentType: 'image/png',
    })
    expect(errors).toEqual([])
  })
})
