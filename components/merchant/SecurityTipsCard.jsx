import { tileColors } from '@/components/merchant/merchantHelpers'

export default function SecurityTipsCard({ tips, t }) {
  return (
    <div className="bg-card rounded-xl shadow-sm dark:shadow-card-dark border border-surface-200">
      <div className="px-5 py-4 border-b border-surface-200">
        <h6 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-0">
          <i className="bx bx-shield text-primary-600 dark:text-primary-400"></i>
          {t('merchant.securityTips', { defaultValue: 'Security Best Practices' })}
        </h6>
      </div>
      <div className="p-5 pt-3">
        {tips.map(({ icon, color, text }, i) => {
          const c = tileColors[color] || tileColors.primary
          return (
            <div
              key={text}
              className={`flex items-start gap-3 py-2.5 ${i < tips.length - 1 ? 'border-b border-surface-200' : ''}`}
            >
              <span className={`flex items-center justify-center w-7 h-7 rounded-lg ${c.bg} shrink-0`}>
                <i className={`bx ${icon} text-sm ${c.icon}`}></i>
              </span>
              <span className="text-sm text-surface-500 dark:text-surface-400 pt-0.5">{text}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
