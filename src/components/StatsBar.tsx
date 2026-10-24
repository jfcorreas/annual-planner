import type { Stats } from '../utils/stats'

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
            <b className={`stats__count${count === 0 ? ' stats__count--zero' : ''}`}>{count}</b>
          </li>
        ))}
        <li className="stats__item" title="Días sin ninguna etiqueta">
          <span className="stats__swatch stats__swatch--none" />
          <span className="stats__label">Sin etiqueta</span>
          <b className={`stats__count${stats.untagged === 0 ? ' stats__count--zero' : ''}`}>
            {stats.untagged}
          </b>
        </li>
      </ul>
    </footer>
  )
}
