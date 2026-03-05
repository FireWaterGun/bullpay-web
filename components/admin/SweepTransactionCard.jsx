'use client';

import { formatUsd } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { Button, Card } from '../ui';

function AddressRow({ label, address, explorerUrl, onCopy }) {
  return (
    <tr>
      <td className="text-muted">{label}</td>
      <td>
        {address ?
        <>
            <code className="break-words text-xs">{address}</code>
            <div className="flex gap-1 mt-2">
              {explorerUrl &&
            <Button variant="outline-primary" size="sm"
            href={`${explorerUrl}/address/${address}`}
            target="_blank"
            rel="noopener noreferrer">
              
              
                  <i className="bx bx-link-external mr-1"></i>Explorer
                </Button>
            }
              <Button

              onClick={() => onCopy(address)} variant="outline-secondary" size="sm">
              
                <i className="bx bx-copy mr-1"></i>Copy
              </Button>
            </div>
          </> :

        <span className="text-muted">N/A</span>
        }
      </td>
    </tr>);

}

export default function SweepTransactionCard({ sweep, explorerUrl, onCopy }) {
  const { t } = useAdminTranslation();
  const { fmtDate } = useDateFormat();
  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-link mr-2"></i>
          Transaction
        </h5>
      </div>
      <div className="p-5">
        <div className="overflow-x-auto">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="text-muted w-2/5">{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</td>
              <td>
                {sweep.txHash ?
                  <>
                    <code className="break-words text-xs">{sweep.txHash}</code>
                    <div className="flex gap-1 mt-2">
                      {explorerUrl &&
                      <Button variant="outline-primary" size="sm"
                      href={`${explorerUrl}/tx/${sweep.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer">
                        
                        
                          <i className="bx bx-link-external mr-1"></i>Explorer
                        </Button>
                      }
                      <Button

                        onClick={() => onCopy(sweep.txHash)} variant="outline-secondary" size="sm">
                        
                        <i className="bx bx-copy mr-1"></i>Copy
                      </Button>
                    </div>
                  </> :

                  <span className="text-muted">-</span>
                  }
              </td>
            </tr>
            {sweep.blockNumber &&
              <tr>
                <td className="text-muted">{t('admin.detail.blockNumber', { defaultValue: 'Block Number' })}</td>
                <td>{sweep.blockNumber}</td>
              </tr>
              }
            {sweep.gasFee &&
              <tr>
                <td className="text-muted">Gas Fee</td>
                <td>{sweep.gasFee}</td>
              </tr>
              }
            {sweep.networkFeeRaw &&
              <tr>
                <td className="text-muted">Network Fee (Raw)</td>
                <td><code className="text-[0.8rem]">{sweep.networkFeeRaw}</code></td>
              </tr>
              }
            {sweep.networkFeeUsd &&
              <tr>
                <td className="text-muted">Network Fee (USD)</td>
                <td>{formatUsd(sweep.networkFeeUsd)}</td>
              </tr>
              }
            <AddressRow label="From Address" address={sweep.fromAddress} explorerUrl={explorerUrl} onCopy={onCopy} />
            <AddressRow label="To Address" address={sweep.toAddress} explorerUrl={explorerUrl} onCopy={onCopy} />
          </tbody>
        </table>
        </div>
      </div>
    </Card>);

}

export function SweepTimestampsCard({ sweep, metadata }) {
  const { t } = useAdminTranslation();
  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-time mr-2"></i>
          Timestamps
        </h5>
      </div>
      <div className="p-5">
        <div className="overflow-x-auto">
        <table className="w-full">
          <tbody>
            <tr>
              <td className="text-muted w-2/5">{t('admin.detail.created', { defaultValue: 'Created' })}</td>
              <td>{fmtDate(sweep.createdAt)}</td>
            </tr>
            {sweep.completedAt &&
              <tr>
                <td className="text-muted">{t('status.completed', { defaultValue: 'Completed' })}</td>
                <td>{fmtDate(sweep.completedAt)}</td>
              </tr>
              }
            {sweep.updatedAt &&
              <tr>
                <td className="text-muted">{t('admin.detail.updated', { defaultValue: 'Updated' })}</td>
                <td>{fmtDate(sweep.updatedAt)}</td>
              </tr>
              }
            {metadata.lastAttemptAt &&
              <tr>
                <td className="text-muted">Last Attempt</td>
                <td>{fmtDate(metadata.lastAttemptAt)}</td>
              </tr>
              }
            {metadata.failedAt &&
              <tr>
                <td className="text-muted">Failed At</td>
                <td className="text-danger">{fmtDate(metadata.failedAt)}</td>
              </tr>
              }
          </tbody>
        </table>
        </div>
      </div>
    </Card>);

}