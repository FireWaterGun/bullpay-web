import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { formatAmount, formatDate } from '../../utils/format'
import CoinImg from '../../components/CoinImg'

export function statusBadgeClass(s) {
  const v = String(s || '').toLowerCase()
  if (v === 'confirmed' || v === 'completed') return 'badge bg-label-success'
  if (v === 'detecting' || v === 'pending') return 'badge bg-label-warning'
  if (v === 'confirming' || v === 'processing') return 'badge bg-label-info'
  if (v === 'failed' || v === 'unconfirmed') return 'badge bg-label-danger'
  if (v === 'expired' || v === 'cancelled' || v === 'canceled') return 'badge bg-label-secondary'
  return 'badge bg-label-secondary'
}

export default function AdminPaymentRow({ payment, onCopy }) {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const coinSymbol = (payment.coin?.symbol || payment.coinSymbol || payment.invoice?.coin?.symbol || '').toUpperCase()
  const networkSymbol = (payment.network?.symbol || payment.networkSymbol || payment.invoice?.network?.symbol || '').toUpperCase()
  const networkName = payment.network?.name || payment.networkName || payment.invoice?.network?.name || ''
  const explorerUrl = payment.explorerUrl || payment.network?.explorerUrl || payment.invoice?.network?.explorerUrl || ''

  return (
    <tr>
      <td>
        <span className="fw-semibold text-primary">{payment.id}</span>
      </td>
      <td className="text-center">
        <span className="fw-medium">{payment.userId || '-'}</span>
      </td>
      <td className="text-center">
        {payment.invoiceId ? (
          <button
            className="btn btn-sm btn-text-primary p-0 fw-medium"
            onClick={() => navigate(`/admin/invoices/${payment.invoiceId}`)}
          >
            #{payment.invoiceId}
          </button>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>
        <div className="d-flex align-items-center">
          <CoinImg
            symbol={coinSymbol}
            networkSymbol={networkSymbol}
            size={24}
            className="me-2"
          />
          <div>
            <div className="fw-medium" style={{ lineHeight: 1.2 }}>{coinSymbol || '-'}</div>
            {networkName && (
              <small className="text-muted" style={{ fontSize: '0.75rem' }}>{networkName}</small>
            )}
          </div>
        </div>
      </td>
      <td className="text-end text-nowrap">
        <span className="fw-medium">
          {formatAmount(payment.amount)} {coinSymbol}
        </span>
      </td>
      <td className="text-end text-nowrap">
        {payment.amountUsd ? (
          <span className="fw-medium">${formatAmount(payment.amountUsd)}</span>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td className="text-nowrap text-center">
        <span className={statusBadgeClass(payment.status)}>
          {String(payment.status || '').toUpperCase()}
        </span>
      </td>
      <td className="text-center">
        {payment.confirmations != null ? (
          <span>{payment.confirmations}/{payment.requiredConfirmations ?? '-'}</span>
        ) : '-'}
      </td>
      <td>
        {payment.txHash ? (
          <div className="d-flex align-items-center">
            <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
              {payment.txHash}
            </span>
            {explorerUrl && (
              <a
                href={`${explorerUrl}/tx/${payment.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
                title="View on explorer"
              >
                <i className="bx bx-link-external" style={{ fontSize: '1.25rem' }}></i>
              </a>
            )}
          </div>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td>
        {payment.fromAddress ? (
          <div className="d-flex align-items-center">
            <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
              {payment.fromAddress}
            </span>
            <button
              className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
              onClick={() => onCopy(payment.fromAddress)}
              title="Copy address"
            >
              <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
            </button>
          </div>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td>
        {payment.toAddress ? (
          <div className="d-flex align-items-center">
            <span className="me-2" style={{ whiteSpace: 'nowrap' }}>
              {payment.toAddress}
            </span>
            <button
              className="btn btn-sm btn-icon btn-text-secondary rounded-pill"
              onClick={() => onCopy(payment.toAddress)}
              title="Copy address"
            >
              <i className="bx bx-copy" style={{ fontSize: '1.25rem' }}></i>
            </button>
          </div>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td>
        <span style={{ whiteSpace: 'nowrap' }}>{formatDate(payment.createdAt || payment.created_at)}</span>
      </td>
      <td>
        <span style={{ whiteSpace: 'nowrap' }}>
          {payment.confirmedAt ? formatDate(payment.confirmedAt) : <span className="text-muted">-</span>}
        </span>
      </td>
      <td>
        <button
          className="btn btn-sm btn-icon btn-text-secondary"
          onClick={() => navigate(`/admin/payments/${payment.id}`)}
          title="View detail"
        >
          <i className="bx bx-show" style={{ fontSize: '1.25rem' }}></i>
        </button>
      </td>
    </tr>
  )
}
