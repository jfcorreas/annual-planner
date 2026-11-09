import pkg from '../../package.json'

interface AboutModalProps {
  /** Close the modal (backdrop click, ✕ or Escape). */
  onClose: () => void
}

/**
 * About dialog opened from the ℹ️ button next to the planner title.
 * The version is read from package.json, so it never drifts from the build.
 */
export function AboutModal({ onClose }: AboutModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal modal--about"
        role="dialog"
        aria-modal="true"
        aria-label="Acerca de la aplicación"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal__head">
          <h2>📅 Planificador anual</h2>
          <button type="button" className="btn" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </header>

        <p className="about__version">Versión {pkg.version}</p>

        <p className="about__text">
          Crea, personaliza y rellena planificadores anuales. Todo se guarda solo en
          este navegador: sin servidores, sin cuentas y sin conexión.
        </p>
      </div>
    </div>
  )
}
