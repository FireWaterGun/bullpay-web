/**
 * CardEmptyState — Beautiful empty state for card bodies (non-table).
 *
 * @param {string}  icon      - Boxicon class name (e.g. "bx-wallet")
 * @param {string}  message   - Display message
 * @param {string}  [sub]     - Optional subtitle / hint text
 * @param {import('react').ReactNode} [children] - Optional action buttons
 */
export default function CardEmptyState({ icon = 'bx-data', message, sub, children }) {
  return (
    <div className="text-center py-5">
      <div className="d-flex flex-column align-items-center gap-2">
        <div
          className="rounded-circle bg-label-secondary d-flex align-items-center justify-content-center mb-1"
          style={{ width: 64, height: 64 }}
        >
          <i className={`bx ${icon} fs-2`}></i>
        </div>
        <span className="fw-medium text-dark">{message}</span>
        {sub && <span className="text-muted small">{sub}</span>}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  )
}
