import { useTranslation } from 'react-i18next'

export default function PaymentProgressSteps({ isPaid, isExpiredUnpaid, currentStep }) {
  const { t } = useTranslation()

  return (
    <div className="mt-3 p-3 rounded-4" style={{
      background: 'rgba(var(--bs-primary-rgb), 0.03)',
      border: '1px solid rgba(var(--bs-primary-rgb), 0.1)'
    }}>
      <div className="d-flex justify-content-between position-relative">
        {/* Progress Line */}
        <div
          className="position-absolute top-0 start-0 h-100"
          style={{ width: '100%', zIndex: 0, marginTop: 19 }}
        >
          <div
            className="position-relative"
            style={{
              height: 3,
              background: 'var(--bs-border-color)',
              marginLeft: 20,
              marginRight: 20,
              borderRadius: 10,
              overflow: 'hidden'
            }}
          >
            <div
              className="position-absolute h-100"
              style={{
                width: isPaid ? '100%' : currentStep >= 2 ? '50%' : '0%',
                background: isPaid ? 'var(--bs-success)' : 'var(--bs-primary)',
                transition: 'width 0.5s ease',
                left: 0,
                top: 0
              }}
            ></div>
          </div>
        </div>

        {/* Step 1 */}
        <div className="text-center" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: 40,
              height: 40,
              background: isPaid
                ? 'var(--bs-success)'
                : currentStep >= 1
                  ? 'var(--bs-primary)'
                  : 'var(--bs-tertiary-bg)',
              boxShadow: 'none',
              transition: 'all 0.3s ease'
            }}
          >
            <i className={`bx bx-coin-stack ${isPaid || currentStep >= 1 ? 'text-white' : 'text-muted'}`} style={{ fontSize: 20 }}></i>
          </div>
          <div className="mt-1" style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: isPaid ? 'var(--bs-success)' : currentStep === 1 ? 'var(--bs-primary)' : 'var(--bs-secondary-color)'
          }}>
            {t("payment.waiting") || "Waiting"}
          </div>
        </div>

        {/* Step 2 */}
        <div className="text-center" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
          <div
            className="d-inline-flex align-items-center justify-content-center rounded-circle"
            style={{
              width: 36,
              height: 36,
              background: isExpiredUnpaid
                ? 'var(--bs-danger)'
                : isPaid
                  ? 'var(--bs-success)'
                  : currentStep >= 2
                    ? 'var(--bs-primary)'
                    : 'var(--bs-tertiary-bg)',
              boxShadow: 'none',
              transition: 'all 0.3s ease'
            }}
          >
            <i
              className={`bx ${isExpiredUnpaid
                  ? 'bx-calendar-x text-white'
                  : isPaid || currentStep >= 2
                    ? 'bx-time-five text-white'
                    : 'bx-time-five text-muted'
                }`}
              style={{ fontSize: 20 }}
            ></i>
          </div>
          <div className="mt-1" style={{
            fontSize: '0.75rem',
            fontWeight: '600',
            color: isExpiredUnpaid ? 'var(--bs-danger)' : isPaid ? 'var(--bs-success)' : currentStep === 2 ? 'var(--bs-primary)' : 'var(--bs-secondary-color)'
          }}>
            {isExpiredUnpaid ? t('payment.expired') || 'Expired' : t("payment.processing") || "Processing"}
          </div>
        </div>

        {/* Step 3 */}
        {!isExpiredUnpaid && (
          <div className="text-center" style={{ flex: 1, position: 'relative', zIndex: 1 }}>
            <div
              className="d-inline-flex align-items-center justify-content-center rounded-circle"
              style={{
                width: 40,
                height: 40,
                background: isPaid
                  ? 'var(--bs-success)'
                  : 'var(--bs-tertiary-bg)',
                boxShadow: 'none',
                transition: 'all 0.3s ease',
                animation: isPaid ? 'bounce 0.6s ease' : 'none'
              }}
            >
              <i className={`bx ${isPaid ? 'bx-badge-check text-white' : 'bx-like text-muted'}`} style={{ fontSize: 20 }}></i>
            </div>
            <div className="mt-1" style={{
              fontSize: '0.75rem',
              fontWeight: '600',
              color: isPaid ? 'var(--bs-success)' : 'var(--bs-secondary-color)'
            }}>
              {t('payment.completed') || 'Success!'}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
