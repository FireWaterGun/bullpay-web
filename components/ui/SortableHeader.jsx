'use client'

/**
 * Sortable table header cell.
 *
 * @param {object}  props
 * @param {string}  props.field      - The sort field key (e.g. 'created_at')
 * @param {string}  props.sortBy     - Currently active sort field
 * @param {string}  props.sortOrder  - 'asc' | 'desc'
 * @param {(field: string, order: string) => void} props.onSort - Sort callback
 * @param {string}  [props.className] - Extra className for <th>
 * @param {React.ReactNode} props.children - Header label
 */
export default function SortableHeader({ field, sortBy, sortOrder, onSort, className = '', children }) {
  const active = sortBy === field
  const isAsc = active && sortOrder === 'asc'
  const isDesc = active && sortOrder === 'desc'

  function handleClick() {
    if (!onSort) return
    if (sortBy === field) {
      onSort(field, sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      onSort(field, 'desc')
    }
  }

  return (
    <th
      className={`cursor-pointer select-none group ${className}`}
      onClick={handleClick}
    >
      <span className="inline-flex items-center gap-1.5">
        <span className={`${active ? 'text-primary-600 dark:text-primary-400' : 'group-hover:text-surface-700 dark:group-hover:text-surface-200'} transition-colors`}>
          {children}
        </span>
        <span className={`inline-flex flex-col gap-[3px] ${active ? 'opacity-100' : 'opacity-0 group-hover:opacity-50'} transition-opacity`}>
          <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
            <path
              d="M1 4L4 1L7 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isAsc ? 'text-primary-500' : 'text-surface-300 dark:text-surface-500'}
            />
          </svg>
          <svg width="8" height="5" viewBox="0 0 8 5" fill="none">
            <path
              d="M1 1L4 4L7 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isDesc ? 'text-primary-500' : 'text-surface-300 dark:text-surface-500'}
            />
          </svg>
        </span>
      </span>
    </th>
  )
}
