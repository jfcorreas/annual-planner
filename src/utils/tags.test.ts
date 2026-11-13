import { describe, expect, it } from 'vitest'
import { tagAcronym } from './tags'

describe('tagAcronym', () => {
  it('keeps the uppercase initial of each word and the digits', () => {
    expect(tagAcronym('Guardia 24h')).toBe('G24')
    expect(tagAcronym('Guardia 17h')).toBe('G17')
    expect(tagAcronym('Diurno 12h')).toBe('D12')
    expect(tagAcronym('Nocturno 12h')).toBe('N12')
    expect(tagAcronym('Turno 24h')).toBe('T24')
    expect(tagAcronym('T24')).toBe('T24')
    expect(tagAcronym('Festivo local')).toBe('F')
    expect(tagAcronym('Festivo regional')).toBe('F')
    expect(tagAcronym('Festivo nacional')).toBe('F')
  })

  it('ignores lowercase words (articles and connectors)', () => {
    expect(tagAcronym('Guardia de tarde')).toBe('G')
    expect(tagAcronym('Permiso médico')).toBe('P')
    expect(tagAcronym('Turno de noche')).toBe('T')
  })

  it('splits on -, _ and / as if they were spaces', () => {
    expect(tagAcronym('Guardia-24h')).toBe('G24')
    expect(tagAcronym('turno/noche')).toBe('TN')
    expect(tagAcronym('mañana_tarde')).toBe('MT')
  })

  it('falls back to the first letter when no word starts with a capital', () => {
    expect(tagAcronym('vacaciones')).toBe('V')
    expect(tagAcronym('24h')).toBe('24')
    expect(tagAcronym('')).toBe('•')
  })
})
