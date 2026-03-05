'use client'

import { useDateFormat } from '@/hooks/useDateFormat'

export default function GasTopupTransactionCard({ topup, explorerUrl, onCopy, t }) {
  const { fmtDate } = useDateFormat()
  return (
    <>
      <div className="card mb-4">
        <div className="px-5 py-4 border-b border-surface-200">
          <h5 className="mb-0">
            <i className="bx bx-link mr-2"></i>
            {t('admin.gasTopup.transaction', { defaultValue: 'Transaction' })}
          </h5>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="text-muted" style={{ width: '40%' }}>{t('admin.gasTopup.txHash', { defaultValue: 'Tx Hash' })}</td>
                <td>
                  {topup.txHash ? (
                    <>
                      <code className="break-words" style={{ fontSize: '0.75rem' }}>{topup.txHash}</code>
                      <div className="flex gap-1 mt-2">
                        {explorerUrl && (
                          <a
                            href={`${explorerUrl}/tx/${topup.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn border border-primary-600 text-primary-600 bg-transparent hover:bg-primary-600 hover:text-white"
                          >
                            <i className="bx bx-link-external mr-1"></i>{t('admin.detail.explorer', { defaultValue: 'Explorer' })}
                          </a>
                        )}
                        <button
                          className="btn btn-sm btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100"
                          onClick={() => onCopy(topup.txHash)}
                        >
                          <i className="bx bx-copy mr-1"></i>{t('admin.detail.copy', { defaultValue: 'Copy' })}
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>
              </tr>
              {topup.blockNumber && (
                <tr>
                  <td className="text-muted">{t('admin.gasTopup.blockNumber', { defaultValue: 'Block Number' })}</td>
                  <td>{topup.blockNumber}</td>
                </tr>
              )}
              {topup.gasUsedRaw && (
                <tr>
                  <td className="text-muted">{t('admin.gasTopup.gasUsed', { defaultValue: 'Gas Used' })}</td>
                  <td><code style={{ fontSize: '0.8rem' }}>{topup.gasUsedRaw}</code></td>
                </tr>
              )}
              {topup.gasPriceRaw && (
                <tr>
                  <td className="text-muted">{t('admin.gasTopup.gasPrice', { defaultValue: 'Gas Price' })}</td>
                  <td><code style={{ fontSize: '0.8rem' }}>{topup.gasPriceRaw}</code></td>
                </tr>
              )}
              <tr>
                <td className="text-muted">{t('admin.gasTopup.fromAddress', { defaultValue: 'From Address' })}</td>
                <td>
                  {topup.fromAddress ? (
                    <>
                      <code className="break-words" style={{ fontSize: '0.75rem' }}>{topup.fromAddress}</code>
                      <div className="flex gap-1 mt-2">
                        {explorerUrl && (
                          <a
                            href={`${explorerUrl}/address/${topup.fromAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn border border-primary-600 text-primary-600 bg-transparent hover:bg-primary-600 hover:text-white"
                          >
                            <i className="bx bx-link-external mr-1"></i>{t('admin.detail.explorer', { defaultValue: 'Explorer' })}
                          </a>
                        )}
                        <button
                          className="btn btn-sm btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100"
                          onClick={() => onCopy(topup.fromAddress)}
                        >
                          <i className="bx bx-copy mr-1"></i>{t('admin.detail.copy', { defaultValue: 'Copy' })}
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="text-muted">{t('admin.gasTopup.toAddress', { defaultValue: 'To Address' })}</td>
                <td>
                  {topup.toAddress ? (
                    <>
                      <code className="break-words" style={{ fontSize: '0.75rem' }}>{topup.toAddress}</code>
                      <div className="flex gap-1 mt-2">
                        {explorerUrl && (
                          <a
                            href={`${explorerUrl}/address/${topup.toAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-sm btn border border-primary-600 text-primary-600 bg-transparent hover:bg-primary-600 hover:text-white"
                          >
                            <i className="bx bx-link-external mr-1"></i>{t('admin.detail.explorer', { defaultValue: 'Explorer' })}
                          </a>
                        )}
                        <button
                          className="btn btn-sm btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100"
                          onClick={() => onCopy(topup.toAddress)}
                        >
                          <i className="bx bx-copy mr-1"></i>{t('admin.detail.copy', { defaultValue: 'Copy' })}
                        </button>
                      </div>
                    </>
                  ) : (
                    <span className="text-muted">N/A</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="px-5 py-4 border-b border-surface-200">
          <h5 className="mb-0">
            <i className="bx bx-time mr-2"></i>
            {t('admin.gasTopup.timestamps', { defaultValue: 'Timestamps' })}
          </h5>
        </div>
        <div className="p-5">
          <div className="overflow-x-auto">
          <table className="w-full">
            <tbody>
              <tr>
                <td className="text-muted" style={{ width: '40%' }}>{t('admin.gasTopup.created', { defaultValue: 'Created' })}</td>
                <td>{fmtDate(topup.createdAt)}</td>
              </tr>
              {topup.processingStartedAt && (
                <tr>
                  <td className="text-muted">{t('admin.gasTopup.processingStartedAt', { defaultValue: 'Processing Started' })}</td>
                  <td>{fmtDate(topup.processingStartedAt)}</td>
                </tr>
              )}
              {topup.completedAt && (
                <tr>
                  <td className="text-muted">{t('admin.gasTopup.completedAt', { defaultValue: 'Completed' })}</td>
                  <td>{fmtDate(topup.completedAt)}</td>
                </tr>
              )}
              {topup.updatedAt && (
                <tr>
                  <td className="text-muted">{t('admin.gasTopup.updated', { defaultValue: 'Updated' })}</td>
                  <td>{fmtDate(topup.updatedAt)}</td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </>
  )
}
