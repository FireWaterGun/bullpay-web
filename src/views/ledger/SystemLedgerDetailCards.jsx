import { formatDateTime as formatDate } from '../../utils/format'

/**
 * Transaction card — reservation, related ID, tx hash, invoice, sweep, note.
 */
export function TransactionCard({ entry, metadata, explorerUrl, onCopy }) {
  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bx bx-link me-2"></i>
          Transaction
        </h5>
      </div>
      <div className="card-body">
        <table className="table table-borderless">
          <tbody>
            {entry.reservationId && (
              <tr>
                <td className="text-muted" style={{ width: '40%' }}>Reservation ID</td>
                <td><code>{entry.reservationId}</code></td>
              </tr>
            )}
            {entry.relatedId && (
              <tr>
                <td className="text-muted">Related ID</td>
                <td>#{entry.relatedId}</td>
              </tr>
            )}
            {entry.txHash && (
              <tr>
                <td className="text-muted">Tx Hash</td>
                <td>
                  <code className="text-break" style={{ fontSize: '0.75rem' }}>{entry.txHash}</code>
                  <div className="d-flex gap-1 mt-2">
                    {explorerUrl && (
                      <a
                        href={`${explorerUrl}/tx/${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-primary"
                        style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                      >
                        <i className="bx bx-link-external me-1"></i>View on Explorer
                      </a>
                    )}
                    <button
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => onCopy(entry.txHash)}
                      style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                    >
                      <i className="bx bx-copy me-1"></i>Copy
                    </button>
                  </div>
                </td>
              </tr>
            )}
            {metadata?.invoiceNumber && (
              <tr>
                <td className="text-muted">Invoice</td>
                <td><span className="badge bg-label-primary">{metadata.invoiceNumber}</span></td>
              </tr>
            )}
            {metadata?.sweepId && (
              <tr>
                <td className="text-muted">Sweep ID</td>
                <td>#{metadata.sweepId}</td>
              </tr>
            )}
            {metadata?.note && (
              <tr>
                <td className="text-muted">Note</td>
                <td className="text-muted" style={{ fontSize: '0.85rem' }}>{metadata.note}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Timestamps card — created, committed, settled, reversed, updated.
 */
export function TimestampsCard({ entry }) {
  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bx bx-time me-2"></i>
          Timestamps
        </h5>
      </div>
      <div className="card-body">
        <table className="table table-borderless">
          <tbody>
            <tr>
              <td className="text-muted" style={{ width: '40%' }}>Created</td>
              <td>{formatDate(entry.createdAt)}</td>
            </tr>
            {entry.committedAt && (
              <tr>
                <td className="text-muted">Committed</td>
                <td>{formatDate(entry.committedAt)}</td>
              </tr>
            )}
            {entry.settledAt && (
              <tr>
                <td className="text-muted">Settled</td>
                <td>{formatDate(entry.settledAt)}</td>
              </tr>
            )}
            {entry.reversedAt && (
              <tr>
                <td className="text-muted">Reversed</td>
                <td>{formatDate(entry.reversedAt)}</td>
              </tr>
            )}
            {entry.updatedAt && (
              <tr>
                <td className="text-muted">Updated</td>
                <td>{formatDate(entry.updatedAt)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/**
 * Metadata card — raw JSON display.
 */
export function MetadataCard({ metadata }) {
  if (!metadata || Object.keys(metadata).length === 0) return null

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bx bx-code-block me-2"></i>
          Metadata
        </h5>
      </div>
      <div className="card-body">
        <pre className="mb-0 p-3 rounded" style={{ fontSize: '0.8rem', maxHeight: '300px', overflow: 'auto', backgroundColor: 'var(--bs-tertiary-bg)', border: '1px solid var(--bs-border-color)' }}>
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </div>
    </div>
  )
}
