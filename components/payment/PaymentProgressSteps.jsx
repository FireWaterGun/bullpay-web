'use client'

import { useTranslation } from 'react-i18next'

export default function PaymentProgressSteps({ isPaid, isExpiredUnpaid, currentStep }) {
  const { t } = useTranslation()

  const steps = [
    { key: 1, label: t("payment.waiting", { defaultValue: "Waiting payment" }), icon: 'bx-time-five' },
    { key: 2, label: isExpiredUnpaid ? (t('payment.expired') || 'Expired') : t("payment.processing", { defaultValue: "Processing" }), icon: isExpiredUnpaid ? 'bx-calendar-x' : 'bx-loader-alt' },
    ...(isExpiredUnpaid ? [] : [{ key: 3, label: t('payment.completed', { defaultValue: 'Complete' }), icon: 'bx-check' }]),
  ]

  function getStepState(stepKey) {
    if (isPaid) return 'done'
    if (isExpiredUnpaid && stepKey === 2) return 'error'
    if (stepKey < currentStep) return 'done'
    if (stepKey === currentStep) return 'active'
    return 'inactive'
  }

  return (
    <div className="mt-4 mb-3 py-3 px-2 rounded-lg" style={{
      border: '1px solid var(--color-surface-200)',
    }}>
      <div className="flex items-start justify-between relative">
        {/* Connector lines */}
        <div className="absolute" style={{ top: 22, left: 0, right: 0, zIndex: 0, padding: '0 60px' }}>
          <div style={{ height: 2, background: 'var(--color-surface-200)', borderRadius: 2 }}>
            <div style={{
              height: '100%', borderRadius: 2,
              background: isPaid ? '#22c55e' : currentStep >= 2 ? 'var(--color-primary-600)' : 'transparent',
              width: isPaid ? '100%' : currentStep >= 2 ? '50%' : '0%',
              transition: 'width 0.4s ease',
            }}></div>
          </div>
        </div>

        {steps.map((step) => {
          const state = getStepState(step.key)
          const isActive = state === 'active'
          const isDone = state === 'done'
          const isError = state === 'error'
          const circleSize = isActive ? 44 : 14

          return (
            <div key={step.key} className="text-center" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <div className="flex justify-center" style={{ height: 44, alignItems: 'center' }}>
                {isActive ? (
                  <div className="flex items-center justify-center rounded-full" style={{
                    width: circleSize, height: circleSize,
                    border: `2px solid var(--color-primary-600)`,
                    background: 'color-mix(in srgb, var(--color-primary-600) 8%, transparent)',
                    transition: 'all 0.3s ease',
                  }}>
                    <i className={`bx ${step.icon}`} style={{ fontSize: 20, color: 'var(--color-primary-600)' }}></i>
                  </div>
                ) : isDone ? (
                  <div className="flex items-center justify-center rounded-full" style={{
                    width: 44, height: 44,
                    background: '#22c55e',
                    transition: 'all 0.3s ease',
                    animation: step.key === 3 ? 'progressBounce 0.6s ease' : 'none',
                  }}>
                    <i className="bx bx-check text-white" style={{ fontSize: 22 }}></i>
                  </div>
                ) : isError ? (
                  <div className="flex items-center justify-center rounded-full" style={{
                    width: 44, height: 44,
                    background: '#ef4444',
                    transition: 'all 0.3s ease',
                  }}>
                    <i className="bx bx-x text-white" style={{ fontSize: 22 }}></i>
                  </div>
                ) : (
                  <div className="rounded-full" style={{
                    width: circleSize, height: circleSize,
                    background: 'var(--color-surface-200)',
                    transition: 'all 0.3s ease',
                  }}></div>
                )}
              </div>
              <div className="mt-1" style={{
                fontSize: '0.7rem', fontWeight: 600,
                color: isDone ? '#22c55e'
                  : isError ? '#ef4444'
                  : isActive ? 'var(--color-primary-600)'
                  : 'var(--color-surface-500)',
              }}>
                {step.label}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes progressBounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}
