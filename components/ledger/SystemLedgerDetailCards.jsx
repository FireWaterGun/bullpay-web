'use client'

import { useDateFormat } from '@/hooks/useDateFormat'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Card from '../ui/Card'

/**
 * Transaction card — reservation, related ID, tx hash, invoice, sweep, note.
 */
export function TransactionCard({ entry, metadata, explorerUrl, onCopy }) {
  const { t } = useAdminTranslation()
  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-link mr-2"></i>
          {t('admin.detail.transaction', { defaultValue: 'Transaction' })}
        </h5>
      </div>
      <div className="p-5">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[70%]" />
          </colgroup>
          <tbody>
            {entry.reservationId && (
              <tr>
                <td className="text-surface-500 align-top">{t('admin.detail.reservationId', { defaultValue: 'Reservation ID' })}</td>
                <td className="break-all">
                  <code>{entry.reservationId}</code>
                </td>
              </tr>
            )}
            {entry.relatedId && (
              <tr>
                <td className="text-surface-500">{t('admin.detail.relatedId', { defaultValue: 'Related ID' })}</td>
                <td>#{entry.relatedId}</td>
              </tr>
            )}
            {entry.txHash && (
              <tr>
                <td className="text-surface-500 align-top">{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</td>
                <td>
                  <code className="break-all text-xs">{entry.txHash}</code>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {explorerUrl && (
                      <Button
                        variant="outline-primary"
                        size="sm"
                        className="py-[0.2rem] px-[0.5rem] text-xs"
                        href={`${explorerUrl}/tx/${entry.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="bx bx-link-external mr-1"></i>{t('admin.detail.viewOnExplorer', { defaultValue: 'View on Explorer' })}
                      </Button>
                    )}
                    <Button
                      onClick={() => onCopy(entry.txHash)}
                      variant="outline-secondary"
                      size="sm"
                      className="py-[0.2rem] px-[0.5rem] text-xs"
                    >
                      <i className="bx bx-copy mr-1"></i>{t('admin.detail.copy', { defaultValue: 'Copy' })}
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            {metadata?.invoiceNumber && (
              <tr>
                <td className="text-surface-500">{t('admin.detail.invoiceNumber', { defaultValue: 'Invoice' })}</td>
                <td>
                  <Badge color="primary" label>
                    {metadata.invoiceNumber}
                  </Badge>
                </td>
              </tr>
            )}
            {metadata?.sweepId && (
              <tr>
                <td className="text-surface-500">{t('admin.detail.sweepId', { defaultValue: 'Sweep ID' })}</td>
                <td>#{metadata.sweepId}</td>
              </tr>
            )}
            {metadata?.note && (
              <tr>
                <td className="text-surface-500">{t('admin.detail.note', { defaultValue: 'Note' })}</td>
                <td className="text-surface-500 text-[0.85rem] break-words">{metadata.note}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/**
 * Timestamps card — created, committed, settled, reversed, updated.
 */
export function TimestampsCard({ entry }) {
  const { fmtDateTime } = useDateFormat()
  const { t } = useAdminTranslation()
  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-time mr-2"></i>
          {t('admin.detail.timestamps', { defaultValue: 'Timestamps' })}
        </h5>
      </div>
      <div className="p-5">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[70%]" />
          </colgroup>
          <tbody>
            <tr>
              <td className="text-surface-500">{t('admin.detail.created', { defaultValue: 'Created' })}</td>
              <td>{fmtDateTime(entry.createdAt)}</td>
            </tr>
            {entry.committedAt && (
              <tr>
                <td className="text-surface-500">{t('admin.detail.committed', { defaultValue: 'Committed' })}</td>
                <td>{fmtDateTime(entry.committedAt)}</td>
              </tr>
            )}
            {entry.settledAt && (
              <tr>
                <td className="text-surface-500">{t('admin.detail.settled', { defaultValue: 'Settled' })}</td>
                <td>{fmtDateTime(entry.settledAt)}</td>
              </tr>
            )}
            {entry.reversedAt && (
              <tr>
                <td className="text-surface-500">{t('admin.detail.reversed', { defaultValue: 'Reversed' })}</td>
                <td>{fmtDateTime(entry.reversedAt)}</td>
              </tr>
            )}
            {entry.updatedAt && (
              <tr>
                <td className="text-surface-500">{t('admin.detail.updated', { defaultValue: 'Updated' })}</td>
                <td>{fmtDateTime(entry.updatedAt)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/**
 * Metadata card — raw JSON display.
 */
export function MetadataCard({ metadata }) {
  const { t } = useAdminTranslation()
  if (!metadata || Object.keys(metadata).length === 0) return null

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-code-block mr-2"></i>
          {t('admin.detail.metadata', { defaultValue: 'Metadata' })}
        </h5>
      </div>
      <div className="p-5">
        <pre
          className="mb-0 p-3 rounded text-[0.8rem] max-h-[300px] overflow-auto bg-surface-100 whitespace-pre-wrap break-all"
          style={{ border: '1px solid var(--color-surface-200)' }}
        >
          {JSON.stringify(metadata, null, 2)}
        </pre>
      </div>
    </Card>
  )
}
