/**
 * TableEmptyState — Beautiful empty state row for tables.
 *
 * Renders a full-width <tr> with centered icon + message.
 * Drop-in replacement for plain "No data found" text in <tbody>.
 *
 * @param {number}  colSpan   - Number of columns to span
 * @param {string}  icon      - Boxicon class name (e.g. "bx-search-alt")
 * @param {string}  message   - Display message
 * @param {string}  [sub]     - Optional subtitle / hint text
 */
export default function TableEmptyState({ colSpan, icon = 'bx-data', message, sub }) {
  return (
    <tr>
      <td colSpan={colSpan} className="text-center py-5">
        <div className="d-flex flex-column align-items-center gap-2">
          <div
            className="rounded-circle bg-label-secondary d-flex align-items-center justify-content-center mb-1"
            style={{ width: 64, height: 64 }}
          >
            <i className={`bx ${icon} fs-2`}></i>
          </div>
          <span className="fw-medium text-dark">{message}</span>
          {sub && <span className="text-muted small">{sub}</span>}
        </div>
      </td>
    </tr>
  )
}
