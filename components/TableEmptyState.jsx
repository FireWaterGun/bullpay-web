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
      <td colSpan={colSpan} className="text-center py-12">
        <div className="flex flex-col items-center gap-2">
          <div className="rounded-full bg-surface-100 dark:bg-dark-elevated flex items-center justify-center mb-1 w-16 h-16">
            <i className={`bx ${icon} text-3xl text-surface-500`}></i>
          </div>
          <span className="font-medium text-surface-900">{message}</span>
          {sub ? <span className="text-surface-500 text-sm">{sub}</span> : null}
        </div>
      </td>
    </tr>
  )
}
