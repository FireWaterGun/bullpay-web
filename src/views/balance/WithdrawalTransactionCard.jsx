import { useTranslation } from 'react-i18next'

export default function WithdrawalTransactionCard({ withdrawal, explorerUrl, onCopy }) {
  const { t } = useTranslation()

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bx bx-link me-2"></i>
          {t('withdrawal.transaction', { defaultValue: 'Transaction' })}
        </h5>
      </div>
      <div className="card-body">
        <table className="table table-borderless">
          <tbody>
            <tr>
              <td className="text-muted" style={{ width: '40%' }}>{t('withdrawal.txHash', { defaultValue: 'Tx Hash' })}</td>
              <td>
                {withdrawal.txHash ? (
                  <>
                    <code className="text-break" style={{ fontSize: '0.75rem' }}>{withdrawal.txHash}</code>
                    <div className="d-flex gap-1 mt-2">
                      {explorerUrl && (
                        <a
                          href={`${explorerUrl}/tx/${withdrawal.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="bx bx-link-external me-1"></i>Explorer
                        </a>
                      )}
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => onCopy(withdrawal.txHash)}
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
            {withdrawal.blockNumber && (
              <tr>
                <td className="text-muted">Block Number</td>
                <td>{withdrawal.blockNumber}</td>
              </tr>
            )}
            <tr>
              <td className="text-muted">{t('withdrawal.fromAddress', { defaultValue: 'From Address' })}</td>
              <td>
                {withdrawal.fromAddress ? (
                  <>
                    <code className="text-break" style={{ fontSize: '0.75rem' }}>{withdrawal.fromAddress}</code>
                    <div className="d-flex gap-1 mt-2">
                      {explorerUrl && (
                        <a
                          href={`${explorerUrl}/address/${withdrawal.fromAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="bx bx-link-external me-1"></i>Explorer
                        </a>
                      )}
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => onCopy(withdrawal.fromAddress)}
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
            <tr>
              <td className="text-muted">{t('withdrawal.toAddress', { defaultValue: 'To Address' })}</td>
              <td>
                {withdrawal.toAddress ? (
                  <>
                    <code className="text-break" style={{ fontSize: '0.75rem' }}>{withdrawal.toAddress}</code>
                    <div className="d-flex gap-1 mt-2">
                      {explorerUrl && (
                        <a
                          href={`${explorerUrl}/address/${withdrawal.toAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-sm btn-outline-primary"
                        >
                          <i className="bx bx-link-external me-1"></i>Explorer
                        </a>
                      )}
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => onCopy(withdrawal.toAddress)}
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
          </tbody>
        </table>
      </div>
    </div>
  )
}
