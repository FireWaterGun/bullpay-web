'use client'

import { useDateFormat } from '@/hooks/useDateFormat'
import Button from '../ui/Button'
import Card from '../ui/Card'
import Table from '../ui/Table'

export default function GasTopupTransactionCard({ topup, explorerUrl, onCopy, t }) {
  const { fmtDate } = useDateFormat()
  return (
    <>
      <Card className="mb-4">
        <div className="px-5 py-4 border-b border-surface-200">
          <h5 className="mb-0">
            <i className="bx bx-link mr-2"></i>
            {t('admin.gasTopup.transaction', { defaultValue: 'Transaction' })}
          </h5>
        </div>
        <div className="p-5">
          <Table>
            <tbody>
              <tr>
                <td className="text-surface-500 w-2/5">{t('admin.gasTopup.txHash', { defaultValue: 'Tx Hash' })}</td>
                <td>
                  {topup.txHash ? (
                    <>
                      <code className="break-words text-xs">{topup.txHash}</code>
                      <div className="flex gap-1 mt-2">
                        {explorerUrl && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            href={`${explorerUrl}/tx/${topup.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="bx bx-link-external mr-1"></i>
                            {t('admin.detail.explorer', { defaultValue: 'Explorer' })}
                          </Button>
                        )}
                        <Button onClick={() => onCopy(topup.txHash)} variant="outline-secondary" size="sm">
                          <i className="bx bx-copy mr-1"></i>
                          {t('admin.detail.copy', { defaultValue: 'Copy' })}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <span className="text-surface-500">-</span>
                  )}
                </td>
              </tr>
              {topup.blockNumber && (
                <tr>
                  <td className="text-surface-500">
                    {t('admin.gasTopup.blockNumber', { defaultValue: 'Block Number' })}
                  </td>
                  <td>{topup.blockNumber}</td>
                </tr>
              )}
              {topup.gasUsedRaw && (
                <tr>
                  <td className="text-surface-500">{t('admin.gasTopup.gasUsed', { defaultValue: 'Gas Used' })}</td>
                  <td>
                    <code className="text-[0.8rem]">{topup.gasUsedRaw}</code>
                  </td>
                </tr>
              )}
              {topup.gasPriceRaw && (
                <tr>
                  <td className="text-surface-500">{t('admin.gasTopup.gasPrice', { defaultValue: 'Gas Price' })}</td>
                  <td>
                    <code className="text-[0.8rem]">{topup.gasPriceRaw}</code>
                  </td>
                </tr>
              )}
              <tr>
                <td className="text-surface-500">
                  {t('admin.gasTopup.fromAddress', { defaultValue: 'From Address' })}
                </td>
                <td>
                  {topup.fromAddress ? (
                    <>
                      <code className="break-words text-xs">{topup.fromAddress}</code>
                      <div className="flex gap-1 mt-2">
                        {explorerUrl && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            href={`${explorerUrl}/address/${topup.fromAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="bx bx-link-external mr-1"></i>
                            {t('admin.detail.explorer', { defaultValue: 'Explorer' })}
                          </Button>
                        )}
                        <Button onClick={() => onCopy(topup.fromAddress)} variant="outline-secondary" size="sm">
                          <i className="bx bx-copy mr-1"></i>
                          {t('admin.detail.copy', { defaultValue: 'Copy' })}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <span className="text-surface-500">N/A</span>
                  )}
                </td>
              </tr>
              <tr>
                <td className="text-surface-500">{t('admin.gasTopup.toAddress', { defaultValue: 'To Address' })}</td>
                <td>
                  {topup.toAddress ? (
                    <>
                      <code className="break-words text-xs">{topup.toAddress}</code>
                      <div className="flex gap-1 mt-2">
                        {explorerUrl && (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            href={`${explorerUrl}/address/${topup.toAddress}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <i className="bx bx-link-external mr-1"></i>
                            {t('admin.detail.explorer', { defaultValue: 'Explorer' })}
                          </Button>
                        )}
                        <Button onClick={() => onCopy(topup.toAddress)} variant="outline-secondary" size="sm">
                          <i className="bx bx-copy mr-1"></i>
                          {t('admin.detail.copy', { defaultValue: 'Copy' })}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <span className="text-surface-500">N/A</span>
                  )}
                </td>
              </tr>
            </tbody>
          </Table>
        </div>
      </Card>

      <Card className="mb-4">
        <div className="px-5 py-4 border-b border-surface-200">
          <h5 className="mb-0">
            <i className="bx bx-time mr-2"></i>
            {t('admin.gasTopup.timestamps', { defaultValue: 'Timestamps' })}
          </h5>
        </div>
        <div className="p-5">
          <Table>
            <tbody>
              <tr>
                <td className="text-surface-500 w-2/5">{t('admin.gasTopup.created', { defaultValue: 'Created' })}</td>
                <td>{fmtDate(topup.createdAt)}</td>
              </tr>
              {topup.processingStartedAt && (
                <tr>
                  <td className="text-surface-500">
                    {t('admin.gasTopup.processingStartedAt', { defaultValue: 'Processing Started' })}
                  </td>
                  <td>{fmtDate(topup.processingStartedAt)}</td>
                </tr>
              )}
              {topup.completedAt && (
                <tr>
                  <td className="text-surface-500">{t('admin.gasTopup.completedAt', { defaultValue: 'Completed' })}</td>
                  <td>{fmtDate(topup.completedAt)}</td>
                </tr>
              )}
              {topup.updatedAt && (
                <tr>
                  <td className="text-surface-500">{t('admin.gasTopup.updated', { defaultValue: 'Updated' })}</td>
                  <td>{fmtDate(topup.updatedAt)}</td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      </Card>
    </>
  )
}
