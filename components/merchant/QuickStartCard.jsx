export default function QuickStartCard({ steps, t }) {
  return (
    <div className="bg-card rounded-xl shadow-sm dark:shadow-card-dark border border-surface-200">
      <div className="px-5 py-4 border-b border-surface-200">
        <h6 className="text-sm font-semibold text-surface-800 flex items-center gap-2 mb-0">
          <i className="bx bx-rocket text-primary-600 dark:text-primary-400"></i>
          {t('merchant.quickStart', { defaultValue: 'Quick Start' })}
        </h6>
      </div>
      <div className="p-5 pt-3">
        {steps.map(({ step, icon, text, done }) => (
          <div
            key={step}
            className={`flex items-center gap-3 py-2.5 ${step < steps.length ? 'border-b border-surface-200' : ''}`}
          >
            <span
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-semibold shrink-0 ${done ? 'bg-success-50 dark:bg-success-950/30 text-success-600 dark:text-success-400' : 'bg-surface-100 dark:bg-dark-elevated text-surface-500'}`}
            >
              {done ? <i className="bx bx-check text-base"></i> : step}
            </span>
            <div className="flex items-center gap-2 min-w-0">
              <i
                className={`bx ${icon} ${done ? 'text-success-600 dark:text-success-400' : 'text-surface-400 dark:text-surface-500'}`}
              ></i>
              <span className={`text-sm ${done ? 'text-surface-800' : 'text-surface-500 dark:text-surface-400'}`}>
                {text}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
