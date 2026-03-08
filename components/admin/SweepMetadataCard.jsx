'use client'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import Badge from '../ui/Badge'
import Card from '../ui/Card'
import Table from '../ui/Table'

export default function SweepMetadataCard({ metadata }) {
  const { t } = useAdminTranslation()
  if (!metadata || Object.keys(metadata).length === 0) return null

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-info-circle mr-2"></i>
          {t('admin.detail.metadata', { defaultValue: 'Metadata' })}
        </h5>
      </div>
      <div className="p-5">
        <Table>
          <tbody>
            {metadata.strategy && (
              <tr>
                <td className="text-surface-500 w-2/5">
                  {t('admin.sweepDetail.strategy', { defaultValue: 'Strategy' })}
                </td>
                <td>{metadata.strategy}</td>
              </tr>
            )}
            {metadata.invoiceNumber && (
              <tr>
                <td className="text-surface-500">{t('admin.invoiceDetail.invoice', { defaultValue: 'Invoice' })}</td>
                <td>
                  <code>{metadata.invoiceNumber}</code>
                  {metadata.invoiceStatus && (
                    <Badge color="secondary" className="ml-2">
                      {metadata.invoiceStatus}
                    </Badge>
                  )}
                </td>
              </tr>
            )}
            {metadata.paymentCount != null && (
              <tr>
                <td className="text-surface-500">
                  {t('admin.sweepDetail.paymentCount', { defaultValue: 'Payment Count' })}
                </td>
                <td>{metadata.paymentCount}</td>
              </tr>
            )}
            {metadata.paymentIds && (
              <tr>
                <td className="text-surface-500">
                  {t('admin.sweepDetail.paymentIds', { defaultValue: 'Payment IDs' })}
                </td>
                <td>{metadata.paymentIds.join(', ')}</td>
              </tr>
            )}
            {metadata.ledgerEntryIds && (
              <tr>
                <td className="text-surface-500">
                  {t('admin.sweepDetail.ledgerEntryIds', { defaultValue: 'Ledger Entry IDs' })}
                </td>
                <td>{metadata.ledgerEntryIds.join(', ')}</td>
              </tr>
            )}
            {metadata.note && (
              <tr>
                <td className="text-surface-500">{t('admin.detail.note', { defaultValue: 'Note' })}</td>
                <td>{metadata.note}</td>
              </tr>
            )}
            {metadata.retryCount != null && (
              <tr>
                <td className="text-surface-500">{t('admin.detail.retryCount', { defaultValue: 'Retry Count' })}</td>
                <td>{metadata.retryCount}</td>
              </tr>
            )}
            {metadata.jobName && (
              <tr>
                <td className="text-surface-500">{t('admin.sweepDetail.job', { defaultValue: 'Job' })}</td>
                <td>
                  <code>{metadata.jobName}</code>
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </Card>
  )
}
