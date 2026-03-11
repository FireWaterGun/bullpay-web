import { tileColors } from '@/components/merchant/merchantHelpers'

export default function StatTile({ icon, label, value, color = 'primary' }) {
  const c = tileColors[color] || tileColors.primary
  return (
    <div className="flex items-center gap-3">
      <span className={`flex items-center justify-center w-10 h-10 rounded-lg ${c.bg} shrink-0`}>
        <i className={`bx ${icon} text-xl ${c.icon}`}></i>
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium text-surface-800 truncate mb-0">{value}</p>
        <p className="text-xs text-surface-400 dark:text-surface-500 mb-0">{label}</p>
      </div>
    </div>
  )
}
