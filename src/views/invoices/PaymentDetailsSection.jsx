import { useTranslation } from 'react-i18next'
import { formatAmount } from '../../utils/format'

export default function PaymentDetailsSection({
  invoice,
  coinSym,
  isPaid,
  isExpired,
  expiryMs,
  remainingMs,
  countdownBadgeClass,
  copied,
  copiedAmt,
  onCopyAddress,
  onCopyAmount,
  formatDuration,
}) {
  const { t } = useTranslation()

  return (
    <div className="col-12">
      {!isExpired || isPaid ? (
        <div className="mb-3">
          <div className="text-muted small mb-1">
            {t("invoices.amount")}
          </div>
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <div className="fs-4 fw-semibold">
              {formatAmount(invoice.amount)} <span>{coinSym}</span>
            </div>
            {invoice.amount != null && (
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                onClick={onCopyAmount}
              >
                <i className="bx bx-copy"></i>
              </button>
            )}
            {copiedAmt && (
              <span className="badge bg-label-success">
                {t("actions.copy") || "Copy"}
              </span>
            )}
          </div>
        </div>
      ) : null}
      {!isExpired || isPaid ? (
        <div className="mb-3">
          <div className="text-muted small">
            {t("invoices.paymentAddress")}
          </div>
          <div className="d-flex align-items-center flex-wrap gap-2">
            <code className="text-break text-body">
              {invoice.paymentAddress || '-'}
            </code>
            {invoice.paymentAddress && (
              <>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={onCopyAddress}
                >
                  <i className="bx bx-copy"></i>
                </button>
                {copied && (
                  <span className="badge bg-label-success">
                    {t("actions.copy") || "Copy"}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      ) : null}
      {!isPaid && (
        <div className="mb-3">
          <div className="text-muted small">
            {t("payment.timeRemaining")}
          </div>
          {expiryMs ? (
            <div className="d-flex align-items-center gap-2">
              <span
                className={`badge rounded-pill ${countdownBadgeClass} px-3 py-2 fs-5`}
                aria-live="polite"
              >
                <i className="bx bx-timer me-1"></i>
                {formatDuration(remainingMs)}
              </span>
            </div>
          ) : (
            <div className="text-muted">-</div>
          )}
        </div>
      )}
      {invoice.description && (
        <div className="mb-1">
          <div className="text-muted small">
            {t("invoices.description")}
          </div>
          <div className="text-muted">
            {invoice.description}
          </div>
        </div>
      )}
    </div>
  )
}
