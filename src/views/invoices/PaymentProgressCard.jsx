import { useTranslation } from 'react-i18next'

export default function PaymentProgressCard({ isPaid, isExpiredUnpaid, currentStep }) {
  const { t } = useTranslation()

  return (
    <div className="card mt-4">
      <div className="card-header">
        <h6 className="mb-0">
          {t("payment.progress") || "Payment Progress"}
        </h6>
      </div>
      <div className="card-body">
        <div className="d-flex flex-column w-100">
          <div className="d-flex">
            <div className="d-flex flex-column align-items-center me-3">
              <span
                className={`d-inline-flex align-items-center justify-content-center rounded-circle border ${
                  isExpiredUnpaid
                    ? 'border-secondary opacity-75'
                    : isPaid
                      ? 'border-success'
                      : currentStep >= 1
                        ? 'border-primary'
                        : 'border-secondary'
                } bg-white`}
                style={{ width: 36, height: 36 }}
              >
                <i
                  className={`bx bx-coin-stack ${
                    isExpiredUnpaid
                      ? 'text-secondary'
                      : isPaid
                        ? 'text-success'
                        : currentStep >= 1
                          ? 'text-primary'
                          : 'text-secondary'
                  }`}
                ></i>
              </span>
              <div
                className={`vr my-2 align-self-center ${
                  isExpiredUnpaid
                    ? 'opacity-50'
                    : isPaid
                      ? 'opacity-75'
                      : currentStep >= 2
                        ? 'opacity-50'
                        : 'opacity-25'
                }`}
                style={{ height: 14 }}
              ></div>
            </div>
            <div className="pt-1">
              <div
                className={`fw-semibold ${
                  isExpiredUnpaid
                    ? 'text-muted'
                    : isPaid
                      ? 'text-success'
                      : currentStep === 1
                        ? 'text-body'
                        : 'text-muted'
                }`}
              >
                {t("payment.waiting") || "Waiting for payment"}
              </div>
            </div>
          </div>

          <div className="d-flex">
            <div className="d-flex flex-column align-items-center me-3">
              <span
                className={`d-inline-flex align-items-center justify-content-center rounded-circle border ${
                  isExpiredUnpaid
                    ? 'border-danger'
                    : isPaid
                      ? 'border-success'
                      : currentStep >= 2
                        ? 'border-primary'
                        : 'border-secondary'
                } bg-white`}
                style={{ width: 36, height: 36 }}
              >
                <i
                  className={`bx ${
                    isExpiredUnpaid
                      ? 'bx-calendar-x text-danger'
                      : isPaid
                        ? 'bx-time-five text-success'
                        : currentStep >= 2
                          ? 'bx-time-five text-primary'
                          : 'bx-time-five text-secondary'
                  }`}
                ></i>
              </span>
              {!isExpiredUnpaid && (
                <div
                  className={`vr my-2 align-self-center ${
                    isPaid ? 'opacity-75' : currentStep >= 3 ? 'opacity-50' : 'opacity-25'
                  }`}
                  style={{ height: 14 }}
                ></div>
              )}
            </div>
            <div className="pt-1">
              <div
                className={`fw-semibold ${
                  isExpiredUnpaid
                    ? 'text-danger'
                    : isPaid
                      ? 'text-success'
                      : currentStep === 2
                        ? 'text-body'
                        : 'text-muted'
                }`}
              >
                {isExpiredUnpaid
                  ? t('payment.expired') || 'Expired'
                  : t("payment.processing") || "Processing payment"}
              </div>
            </div>
          </div>

          {!isExpiredUnpaid && (
            <div className="d-flex">
              <div className="d-flex flex-column align-items-center me-3">
                <span
                  className={`d-inline-flex align-items-center justify-content-center rounded-circle border ${
                    isPaid
                      ? 'border-success'
                      : currentStep >= 3
                        ? 'border-primary'
                        : 'border-secondary'
                  } bg-white`}
                  style={{ width: 36, height: 36 }}
                >
                  <i
                    className={`bx ${
                      isPaid
                        ? 'bx-badge-check text-success'
                        : currentStep >= 3
                          ? 'bx-like text-primary'
                          : 'bx-like text-secondary'
                    }`}
                  ></i>
                </span>
              </div>
              <div className="pt-1">
                <div
                  className={`fw-semibold ${
                    isPaid
                      ? 'text-success'
                      : currentStep === 3
                        ? 'text-body'
                        : 'text-muted'
                  }`}
                >
                  {t('payment.completed') || 'Success!'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
