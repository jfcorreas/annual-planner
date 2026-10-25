import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render } from '@testing-library/react'
import { TagDetailModal } from './TagDetailModal'
import type { Tag } from '../types'

const TAG: Tag = { id: 'g24', label: 'Guardia 24h', category: 'trabajo', color: '#facc15' }

function renderModal(overrides: Partial<Parameters<typeof TagDetailModal>[0]> = {}) {
  const onSaveSubtitle = vi.fn()
  const onRemove = vi.fn()
  const onClose = vi.fn()
  const view = render(
    <TagDetailModal
      tag={TAG}
      date="2026-01-05"
      subtitle=""
      typeLabel="Trabajo"
      occurrences={3}
      onSaveSubtitle={onSaveSubtitle}
      onRemove={onRemove}
      onClose={onClose}
      {...overrides}
    />,
  )
  return { ...view, onSaveSubtitle, onRemove, onClose }
}

describe('TagDetailModal', () => {
  it('shows every detail of the application', () => {
    const { container } = renderModal()
    const modal = container.querySelector('.modal--tag-detail')!

    expect(modal.textContent).toContain('Guardia 24h')
    expect(modal.textContent).toContain('Trabajo')
    expect(modal.textContent).toContain('#facc15')
    expect(modal.textContent).toContain('5 de enero de 2026')
    expect(modal.textContent).toContain('3 veces este año')
  })

  it('uses singular wording for one application', () => {
    const { container } = renderModal({ occurrences: 1 })
    expect(container.querySelector('.modal--tag-detail')!.textContent).toContain(
      '1 vez este año',
    )
  })

  it('saves a trimmed subtitle and closes', () => {
    const { container, onSaveSubtitle, onClose } = renderModal()

    const input = container.querySelector('.tag-detail__form input') as HTMLInputElement
    fireEvent.change(input, { target: { value: '  de tarde  ' } })
    fireEvent.click(container.querySelector('.tag-detail__form button[type="submit"]')!)

    expect(onSaveSubtitle).toHaveBeenCalledWith('de tarde')
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not save when the subtitle did not change', () => {
    const { container, onSaveSubtitle } = renderModal({ subtitle: 'noche' })

    const input = container.querySelector('.tag-detail__form input') as HTMLInputElement
    expect(input.value).toBe('noche')
    expect(
      (container.querySelector('.tag-detail__form button[type="submit"]') as HTMLButtonElement)
        .disabled,
    ).toBe(true)

    fireEvent.change(input, { target: { value: 'mañana' } })
    fireEvent.click(container.querySelector('.tag-detail__form button[type="submit"]')!)
    expect(onSaveSubtitle).toHaveBeenCalledWith('mañana')
  })

  it('removes the application from the day with the action button', () => {
    const { container, onRemove } = renderModal()
    fireEvent.click(container.querySelector('.tag-detail__actions .btn')!)
    expect(onRemove).toHaveBeenCalledTimes(1)
  })

  it('closes with the ✕ button, the backdrop and Esc', () => {
    const { container, onClose } = renderModal()

    fireEvent.click(container.querySelector('.modal__head .btn')!)
    expect(onClose).toHaveBeenCalledTimes(1)

    fireEvent.click(container.querySelector('.modal-backdrop')!)
    expect(onClose).toHaveBeenCalledTimes(2)

    // Esc is handled globally by App; the modal itself must not swallow it.
    fireEvent.keyDown(container.querySelector('.modal--tag-detail')!, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(2)
  })
})
