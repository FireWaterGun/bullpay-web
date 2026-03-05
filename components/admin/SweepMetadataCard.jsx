'use client'

export default function SweepMetadataCard({ metadata }) {
  if (!metadata || Object.keys(metadata).length === 0) return null

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bx bx-info-circle me-2"></i>
          Metadata
        </h5>
      </div>
      <div className="card-body">
        <div className="table-responsive">
        <table className="table table-borderless">
          <tbody>
            {metadata.strategy && (
              <tr>
                <td className="text-muted" style={{ width: '40%' }}>Strategy</td>
                <td>{metadata.strategy}</td>
              </tr>
            )}
            {metadata.invoiceNumber && (
              <tr>
                <td className="text-muted">Invoice</td>
                <td>
                  <code>{metadata.invoiceNumber}</code>
                  {metadata.invoiceStatus && (
                    <span className="badge bg-label-secondary ms-2">{metadata.invoiceStatus}</span>
                  )}
                </td>
              </tr>
            )}
            {metadata.paymentCount != null && (
              <tr>
                <td className="text-muted">Payment Count</td>
                <td>{metadata.paymentCount}</td>
              </tr>
            )}
            {metadata.paymentIds && (
              <tr>
                <td className="text-muted">Payment IDs</td>
                <td>{metadata.paymentIds.join(', ')}</td>
              </tr>
            )}
            {metadata.ledgerEntryIds && (
              <tr>
                <td className="text-muted">Ledger Entry IDs</td>
                <td>{metadata.ledgerEntryIds.join(', ')}</td>
              </tr>
            )}
            {metadata.note && (
              <tr>
                <td className="text-muted">Note</td>
                <td>{metadata.note}</td>
              </tr>
            )}
            {metadata.retryCount != null && (
              <tr>
                <td className="text-muted">Retry Count</td>
                <td>{metadata.retryCount}</td>
              </tr>
            )}
            {metadata.jobName && (
              <tr>
                <td className="text-muted">Job</td>
                <td><code>{metadata.jobName}</code></td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  )
}
