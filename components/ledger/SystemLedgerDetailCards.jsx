'use client';

import { useDateFormat } from '@/hooks/useDateFormat';
import { Badge, Button, Card } from '../ui';

/**
 * Transaction card — reservation, related ID, tx hash, invoice, sweep, note.
 */
export function TransactionCard({ entry, metadata, explorerUrl, onCopy }) {
  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-link mr-2"></i>
          Transaction
        </h5>
      </div>
      <div className="p-5">
        <table className="w-full">
          <tbody>
            {entry.reservationId &&
            <tr>
                <td className="text-muted w-2/5">Reservation ID</td>
                <td><code>{entry.reservationId}</code></td>
              </tr>
            }
            {entry.relatedId &&
            <tr>
                <td className="text-muted">Related ID</td>
                <td>#{entry.relatedId}</td>
              </tr>
            }
            {entry.txHash &&
            <tr>
                <td className="text-muted">Tx Hash</td>
                <td>
                  <code className="break-words text-xs">{entry.txHash}</code>
                  <div className="flex gap-1 mt-2">
                    {explorerUrl &&
                  <Button variant="outline-primary" size="sm" className="py-[0.2rem] px-[0.5rem] text-xs"
                  href={`${explorerUrl}/tx/${entry.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer">
                    

                    
                        <i className="bx bx-link-external mr-1"></i>View on Explorer
                      </Button>
                  }
                    <Button

                    onClick={() => onCopy(entry.txHash)} variant="outline-secondary" size="sm" className="py-[0.2rem] px-[0.5rem] text-xs">

                    
                      <i className="bx bx-copy mr-1"></i>Copy
                    </Button>
                  </div>
                </td>
              </tr>
            }
            {metadata?.invoiceNumber &&
            <tr>
                <td className="text-muted">Invoice</td>
                <td><Badge className="bg-primary-50 text-primary-600">{metadata.invoiceNumber}</Badge></td>
              </tr>
            }
            {metadata?.sweepId &&
            <tr>
                <td className="text-muted">Sweep ID</td>
                <td>#{metadata.sweepId}</td>
              </tr>
            }
            {metadata?.note &&
            <tr>
                <td className="text-muted">Note</td>
                <td className="text-muted text-[0.85rem]">{metadata.note}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </Card>);

}

/**
 * Timestamps card — created, committed, settled, reversed, updated.
 */
export function TimestampsCard({ entry }) {
  const { fmtDateTime } = useDateFormat();
  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-time mr-2"></i>
          Timestamps
        </h5>
      </div>
      <div className="p-5">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="text-muted w-2/5">Created</td>
              <td>{fmtDateTime(entry.createdAt)}</td>
            </tr>
            {entry.committedAt &&
            <tr>
                <td className="text-muted">Committed</td>
                <td>{fmtDateTime(entry.committedAt)}</td>
              </tr>
            }
            {entry.settledAt &&
            <tr>
                <td className="text-muted">Settled</td>
                <td>{fmtDateTime(entry.settledAt)}</td>
              </tr>
            }
            {entry.reversedAt &&
            <tr>
                <td className="text-muted">Reversed</td>
                <td>{fmtDateTime(entry.reversedAt)}</td>
              </tr>
            }
            {entry.updatedAt &&
            <tr>
                <td className="text-muted">Updated</td>
                <td>{fmtDateTime(entry.updatedAt)}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </Card>);

}

/**
 * Metadata card — raw JSON display.
 */
export function MetadataCard({ metadata }) {
  if (!metadata || Object.keys(metadata).length === 0) return null;

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-code-block mr-2"></i>
          Metadata
        </h5>
      </div>
      <div className="p-5">
        <pre className="mb-0 p-3 rounded text-[0.8rem] max-h-[300px] overflow-auto bg-surface-100" style={{ border: '1px solid var(--color-surface-200)' }}>
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </div>
    </Card>);

}