'use client'

import { formatUsd } from '@/lib/utils/format'
import { useDateFormat } from '@/hooks/useDateFormat'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Table from '../ui/Table'

function AddressRow({ label, address, explorerUrl, onCopy, t }) {
  return (
    <tr>
      <td className="text-surface-500">{label}</td>
      <td>
        {address ? (
          <>
            <code className="break-words text-xs">{address}</code>
            <div className="flex gap-1 mt-2">
              {explorerUrl && (
                <Button
                  variant="outline-primary"
                  size="sm"
                  href={`${explorerUrl}/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="bx bx-link-external mr-1"></i>{t('admin.detail.explorer', { defaultValue: 'Explorer' })}
                </Button>
              )}
              <Button onClick={() => onCopy(address)} variant="outline-secondary" size="sm">
                <i className="bx bx-copy mr-1"></i>{t('admin.detail.copy', { defaultValue: 'Copy' })}
              </Button>
            </div>
          </>
        ) : (
          <span className="text-surface-500">N/A</span>
        )}
      </td>
    </tr>
  )
}

export default function SweepTransactionCard({ sweep, explorerUrl, onCopy }) {
  const { t } = useAdminTranslation()
  const { fmtDate } = useDateFormat()
  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-link mr-2"></i>
          {t('admin.detail.transaction', { defaultValue: 'Transaction' })}
        </h5>
      </div>
      <div className="p-5">
        <Table>
          <tbody>
            <tr>
              <td className="text-surface-500 w-2/5">{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</td>
              <td>
                {sweep.txHash ? (
                  <>
                    <code className="break-words text-xs">{sweep.txHash}</code>
                    <div className="flex gap-1 mt-2">
                      {explorerUrl && (
                        <Button
                          variant="outline-primary"
                          size="sm"
                          href={`${explorerUrl}/tx/${sweep.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <i className="bx bx-link-external mr-1"></i>{t('admin.detail.explorer', { defaultValue: 'Explorer' })}
                        </Button>
                      )}
                      <Button onClick={() => onCopy(sweep.txHash)} variant="outline-secondary" size="sm">
                        <i className="bx bx-copy mr-1"></i>{t('admin.detail.copy', { defaultValue: 'Copy' })}
                      </Button>
                    </div>
                  </>
                ) : (
                  <span className="text-surface-500">-</span>
                )}
              </td>
            </tr>
            {sweep.blockNumber && (
              <tr>
                <td className="text-surface-500">{t('admin.detail.blockNumber', { defaultValue: 'Block Number' })}</td>
                <td>{sweep.blockNumber}</td>
              </tr>
            )}
            {sweep.gasFee && (
              <tr>
                <td className="text-surface-500">{t('admin.sweepDetail.gasFee', { defaultValue: 'Gas Fee' })}</td>
                <td>{sweep.gasFee}</td>
              </tr>
            )}
            {sweep.networkFeeRaw && (
              <tr>
                <td className="text-surface-500">{t('admin.sweepDetail.networkFeeRaw', { defaultValue: 'Network Fee (Raw)' })}</td>
                <td>
                  <code className="text-[0.8rem] break-all">{sweep.networkFeeRaw}</code>
                </td>
              </tr>
            )}
            {sweep.networkFeeUsd && (
              <tr>
                <td className="text-surface-500">{t('admin.sweepDetail.networkFeeUsd', { defaultValue: 'Network Fee (USD)' })}</td>
                <td>{formatUsd(sweep.networkFeeUsd)}</td>
              </tr>
            )}
            <AddressRow label={t('admin.detail.fromAddress', { defaultValue: 'From Address' })} address={sweep.fromAddress} explorerUrl={explorerUrl} onCopy={onCopy} t={t} />
            <AddressRow label={t('admin.detail.toAddress', { defaultValue: 'To Address' })} address={sweep.toAddress} explorerUrl={explorerUrl} onCopy={onCopy} t={t} />
          </tbody>
        </Table>
      </div>
    </Card>
  )
}

export function SweepTimestampsCard({ sweep, metadata }) {
  const { t } = useAdminTranslation()
  const { fmtDate } = useDateFormat()
  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-time mr-2"></i>
          {t('admin.detail.timestamps', { defaultValue: 'Timestamps' })}
        </h5>
      </div>
      <div className="p-5">
        <Table>
          <tbody>
            <tr>
              <td className="text-surface-500 w-2/5">{t('admin.detail.created', { defaultValue: 'Created' })}</td>
              <td>{fmtDate(sweep.createdAt)}</td>
            </tr>
            {sweep.completedAt && (
              <tr>
                <td className="text-surface-500">{t('status.completed', { defaultValue: 'Completed' })}</td>
                <td>{fmtDate(sweep.completedAt)}</td>
              </tr>
            )}
            {sweep.updatedAt && (
              <tr>
                <td className="text-surface-500">{t('admin.detail.updated', { defaultValue: 'Updated' })}</td>
                <td>{fmtDate(sweep.updatedAt)}</td>
              </tr>
            )}
            {metadata.lastAttemptAt && (
              <tr>
                <td className="text-surface-500">{t('admin.sweepDetail.lastAttempt', { defaultValue: 'Last Attempt' })}</td>
                <td>{fmtDate(metadata.lastAttemptAt)}</td>
              </tr>
            )}
            {metadata.failedAt && (
              <tr>
                <td className="text-surface-500">{t('admin.sweepDetail.failedAt', { defaultValue: 'Failed At' })}</td>
                <td className="text-danger">{fmtDate(metadata.failedAt)}</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </Card>
  )
}
