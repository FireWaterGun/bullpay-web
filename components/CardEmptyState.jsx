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
    <div className="text-center py-12">
      <div className="flex flex-col items-center gap-2">
        <div className="rounded-full bg-surface-100 dark:bg-dark-elevated flex items-center justify-center mb-1 w-16 h-16">
          <i className={`bx ${icon} text-3xl text-surface-500`}></i>
        </div>
        <span className="font-medium text-surface-900">{message}</span>
        {sub && <span className="text-surface-500 text-sm">{sub}</span>}
        {children && <div className="mt-2">{children}</div>}
      </div>
    </div>
  )
}
