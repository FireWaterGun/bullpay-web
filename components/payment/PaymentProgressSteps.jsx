'use client'

import { useTranslation } from 'react-i18next'

const CIRCLE_STYLES = {
  done: {
    width: 28, height: 28,
    background: '#dcfce7',
    border: '1.5px solid var(--color-success-400)',
    transition: 'all 0.3s ease',
  },
  error: {
    width: 28, height: 28,
    background: '#fef2f2',
    border: '1.5px solid var(--color-danger-400)',
    transition: 'all 0.3s ease',
  },
  active: {
    width: 28, height: 28,
    background: 'var(--color-primary-600)',
    border: '1.5px solid var(--color-primary-600)',
    boxShadow: '0 0 0 4px color-mix(in srgb, var(--color-primary-600) 15%, transparent)',
    transition: 'all 0.3s ease',
  },
  inactive: {
    width: 10, height: 10,
    background: 'var(--color-surface-200)',
    border: '1.5px solid var(--color-surface-300)',
    transition: 'all 0.3s ease',
  },
  donePop: {
    width: 28, height: 28,
    background: '#dcfce7',
    border: '1.5px solid var(--color-success-400)',
    transition: 'all 0.3s ease',
    animation: 'progressPop 0.5s ease',
  },
}

const LABEL_COLORS = {
  done: { color: 'var(--color-success-600)' },
  error: { color: 'var(--color-danger-500)' },
  active: { color: 'var(--color-primary-600)' },
  inactive: { color: 'var(--color-surface-400)' },
}

export default function PaymentProgressSteps({ isPaid, isExpiredUnpaid, currentStep }) {
  const { t } = useTranslation()

  const steps = [
    { key: 1, label: t('payment.waiting', { defaultValue: 'Waiting payment' }), icon: 'bx-time-five' },
    {
      key: 2,
      label: isExpiredUnpaid
        ? t('payment.expired') || 'Expired'
        : t('payment.processing', { defaultValue: 'Processing' }),
      icon: isExpiredUnpaid ? 'bx-calendar-x' : 'bx-loader-alt',
    },
    ...(isExpiredUnpaid
      ? []
      : [{ key: 3, label: t('payment.completed', { defaultValue: 'Complete' }), icon: 'bx-check' }]),
  ]

  function getStepState(stepKey) {
    if (isPaid) return 'done'
    if (isExpiredUnpaid && stepKey === 2) return 'error'
    if (stepKey < currentStep) return 'done'
    if (stepKey === currentStep) return 'active'
    return 'inactive'
  }

  const size = 28

  return (
    <div className="mt-4 mb-3 py-4 px-6">
      <div className="flex items-start justify-between relative">
        {/* Connector line */}
        <div
          className="absolute left-0 right-0 z-0"
          style={{
            top: size / 2 - 1,
            paddingLeft: `calc(100% / ${steps.length * 2})`,
            paddingRight: `calc(100% / ${steps.length * 2})`,
          }}
        >
          <div className="h-[2px] rounded-full bg-surface-200">
            <div
              className="h-full rounded-full"
              style={{
                background: isPaid
                  ? 'var(--color-success-400)'
                  : currentStep >= 2
                    ? 'var(--color-primary-500)'
                    : 'transparent',
                width: isPaid ? '100%' : currentStep >= 2 ? '50%' : '0%',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        </div>

        {steps.map((step) => {
          const state = getStepState(step.key)
          const isDone = state === 'done'
          const circleKey = isDone && step.key === 3 ? 'donePop' : state

          return (
            <div key={step.key} className="text-center flex-1 relative z-[1]">
              <div className="flex justify-center items-center" style={{ height: size }}>
                <div
                  className="flex items-center justify-center rounded-full"
                  style={CIRCLE_STYLES[circleKey]}
                >
                  {isDone ? <i className="bx bx-check text-success-500 text-[15px]" /> : null}
                  {state === 'error' ? <i className="bx bx-x text-danger-500 text-[15px]" /> : null}
                  {state === 'active' ? <i className={`bx ${step.icon} text-white text-[13px]`} /> : null}
                </div>
              </div>
              <div
                className="mt-2 text-[0.64rem] font-medium leading-tight"
                style={LABEL_COLORS[state]}
              >
                {step.label}
              </div>
            </div>
          )
        })}
      </div>

      <style>{`
        @keyframes progressPop {
          0%, 100% { transform: scale(1); }
          40% { transform: scale(1.15); }
        }
      `}</style>
    </div>
  )
}
