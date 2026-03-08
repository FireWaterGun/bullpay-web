'use client'

import Link from 'next/link'

/**
 * Reusable admin breadcrumb component.
 *
 * Usage:
 *   <AdminBreadcrumb items={[
 *     { label: 'Invoices', href: '/admin/invoices', icon: 'bx-receipt' },
 *     { label: `Invoice #${id}` },
 *   ]} />
 *
 * Props:
 *  - items: Array of { label, href?, icon? }
 *    Last item = current page (no link, bold)
 */
export default function AdminBreadcrumb({ items = [] }) {
  return (
    <nav aria-label="breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm mb-0 flex-wrap">
        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <li key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-surface-400 mr-0.5">/</span>}

              {isLast ? (
                <span className="text-surface-800 font-medium">
                  {item.icon && <i className={`bx ${item.icon} mr-1`}></i>}
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href || '#'}
                  className="text-surface-500 hover:text-primary transition-colors"
                >
                  {item.icon && <i className={`bx ${item.icon} mr-1`}></i>}
                  {item.label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
