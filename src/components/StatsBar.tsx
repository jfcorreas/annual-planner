import type { Stats } from '../utils/stats'
import { tagIcon } from '../utils/tags'

interface StatsBarProps {
  stats: Stats
  /** Big year shown at the left (year view footer); omit in month view. */
  year?: number
  /** Extra content on the right (e.g. hint text). */
  className?: string
}

/** Footer of the planner: how many times each tag is placed. */
export function StatsBar({ stats, year, className = '' }: StatsBarProps) {
  return (
    <footer className={`stats ${className}`.trim()}>
      {year !== undefined && <span className="stats__year" aria-hidden="true">{year}</span>}
      <ul className="stats__list">
        {stats.counts.map(({ tag, count }) => (
          <li key={tag.id} className="stats__item" title={tag.label}>
            <span className="stats__swatch" style={{ backgroundColor: tag.color }} />
            <span className="stats__label">{tag.label}</span>
            {/* No "Restantes" here: the count always keeps the normal colour. */}
            <b className="stats__count">{count}</b>
          </li>
        ))}
      </ul>
      <ul className="stats__list stats__list--permits">
        {stats.permits.map(({ tag, count }) => {
          // Year bar only: the max is yearly, so a month bar shows the plain count.
          const max = year !== undefined ? tag.maxPerYear : undefined
          const remaining = max !== undefined ? max - count : undefined
          const text =
            remaining !== undefined ? `${count} de ${max} · Restantes ${remaining}` : String(count)
          return (
            <li key={tag.id} className="stats__item" title={tag.label}>
              <span className="stats__swatch" style={{ backgroundColor: tag.color }} />
              <span className="stats__icon" aria-hidden="true">{tagIcon(tag).trim()}</span>
              <span className="stats__label">{tag.label}</span>
              {/* Colour rule: grey only when the permit is used up
                  (Restantes 0), red when overused (Restantes < 0);
                  any other case keeps the normal text colour. */}
              <b
                className={`stats__count${remaining === 0 ? ' stats__count--zero' : ''}${
                  remaining !== undefined && remaining < 0 ? ' stats__count--negative' : ''
                }`}
              >
                {text}
              </b>
            </li>
          )
        })}
      </ul>
    </footer>
  )
}
