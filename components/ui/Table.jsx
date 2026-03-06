'use client'

/**
 * Table — replaces `.table` + `.table-responsive` CSS classes.
 * Wrap in <Table> for styling, use standard <thead>/<tbody>/<tr>/<th>/<td>.
 */
export default function Table({ responsive = true, className = '', children, ...rest }) {
  const tableCls = [
    'w-full text-base align-middle',
    // th
    '[&_th]:font-semibold [&_th]:text-surface-600 [&_th]:text-[0.8125rem] [&_th]:uppercase [&_th]:tracking-[0.2px]',
    '[&_th]:px-5 [&_th]:py-[0.782rem]',
    '[&_thead_th]:border-t [&_thead_th]:border-b [&_thead_th]:border-surface-200',
    // td
    '[&>:not(caption)>*>*]:px-5 [&>:not(caption)>*>*]:py-[0.782rem]',
    '[&>:not(caption)>*>*]:text-surface-700',
    '[&>:not(caption)>*>*]:border-b [&>:not(caption)>*>*]:border-surface-100',
    // hover
    '[&_tbody_tr:hover>*]:bg-[rgba(34,48,62,0.04)]',
    // dark
    'dark:[&_th]:text-surface-500 dark:[&_thead_th]:border-surface-200',
    'dark:[&>:not(caption)>*>*]:text-surface-700 dark:[&>:not(caption)>*>*]:border-surface-200',
    'dark:[&_tbody_tr:hover>*]:bg-white/4',
    className,
  ].filter(Boolean).join(' ')

  const table = (
    <table className={tableCls} {...rest}>
      {children}
    </table>
  )

  if (!responsive) return table

  return (
    <div className="overflow-x-auto [-webkit-overflow-scrolling:touch]">
      {table}
    </div>
  )
}
