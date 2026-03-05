'use client'

import { formatUsd } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'

function AddressRow({ label, address, explorerUrl, onCopy }) {
  return (
    <tr>
      <td className="text-muted">{label}</td>
      <td>
        {address ? (
          <>
            <code className="text-break" style={{ fontSize: '0.75rem' }}>{address}</code>
            <div className="d-flex gap-1 mt-2">
              {explorerUrl && (
                <a
                  href={`${explorerUrl}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline-primary"
                >
                  <i className="bx bx-link-external me-1"></i>Explorer
                </a>
              )}
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => onCopy(address)}
              >
                <i className="bx bx-copy me-1"></i>Copy
              </button>
            </div>
          </>
        ) : (
          <span className="text-muted">N/A</span>
        )}
      </td>
    </tr>
  )
}

export default function SweepTransactionCard({ sweep, explorerUrl, onCopy }) {
  const { t } = useAdminTranslation()
  const { fmtDate } = useDateFormat()
  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bx bx-link me-2"></i>
          Transaction
        </h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
        <table className="table table-borderless">
          <tbody>
            <tr>
              <td className="text-muted" style={{ width: '40%' }}>{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</td>
              <td>
                {sweep.txHash ? (
                  <>
                    <code className="text-break" style={{ fontSize: '0.75rem' }}>{sweep.txHash}</code>
                    <div className="d-flex gap-1 mt-2">
                      {explorerUrl && (
                        <a
                          href={`${explorerUrl}/tx/${sweep.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="bx bx-link-external me-1"></i>Explorer
                        </a>
                      )}
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => onCopy(sweep.txHash)}
                      >
                        <i className="bx bx-copy me-1"></i>Copy
                      </button>
                    </div>
                  </>
                ) : (
                  <span className="text-muted">-</span>
                )}
              </td>
            </tr>
            {sweep.blockNumber && (
              <tr>
                <td className="text-muted">{t('admin.detail.blockNumber', { defaultValue: 'Block Number' })}</td>
                <td>{sweep.blockNumber}</td>
              </tr>
            )}
            {sweep.gasFee && (
              <tr>
                <td className="text-muted">Gas Fee</td>
                <td>{sweep.gasFee}</td>
              </tr>
            )}
            {sweep.networkFeeRaw && (
              <tr>
                <td className="text-muted">Network Fee (Raw)</td>
                <td><code style={{ fontSize: '0.8rem' }}>{sweep.networkFeeRaw}</code></td>
              </tr>
            )}
            {sweep.networkFeeUsd && (
              <tr>
                <td className="text-muted">Network Fee (USD)</td>
                <td>{formatUsd(sweep.networkFeeUsd)}</td>
              </tr>
            )}
            <AddressRow label="From Address" address={sweep.fromAddress} explorerUrl={explorerUrl} onCopy={onCopy} />
            <AddressRow label="To Address" address={sweep.toAddress} explorerUrl={explorerUrl} onCopy={onCopy} />
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}

export function SweepTimestampsCard({ sweep, metadata }) {
  const { t } = useAdminTranslation()
  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bx bx-time me-2"></i>
          Timestamps
        </h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
        <table className="table table-borderless">
          <tbody>
            <tr>
              <td className="text-muted" style={{ width: '40%' }}>{t('admin.detail.created', { defaultValue: 'Created' })}</td>
              <td>{fmtDate(sweep.createdAt)}</td>
            </tr>
            {sweep.completedAt && (
              <tr>
                <td className="text-muted">{t('status.completed', { defaultValue: 'Completed' })}</td>
                <td>{fmtDate(sweep.completedAt)}</td>
              </tr>
            )}
            {sweep.updatedAt && (
              <tr>
                <td className="text-muted">{t('admin.detail.updated', { defaultValue: 'Updated' })}</td>
                <td>{fmtDate(sweep.updatedAt)}</td>
              </tr>
            )}
            {metadata.lastAttemptAt && (
              <tr>
                <td className="text-muted">Last Attempt</td>
                <td>{fmtDate(metadata.lastAttemptAt)}</td>
              </tr>
            )}
            {metadata.failedAt && (
              <tr>
                <td className="text-muted">Failed At</td>
                <td className="text-danger">{fmtDate(metadata.failedAt)}</td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
