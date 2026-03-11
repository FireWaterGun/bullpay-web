import { useDateFormat } from '@/hooks/useDateFormat'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

export default function TempWalletTimestampsCard({ wallet, t }) {
  const { fmtDate } = useDateFormat()

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-time-five mr-2"></i>
          {t('admin.detail.timestamps', { defaultValue: 'Timestamps' })}
        </h5>
      </div>
      <div className="p-5">
        <Table responsive={false} className="mb-0">
          <tbody>
            <tr>
              <td className="text-surface-500 w-2/5">
                {t('admin.detail.created', { defaultValue: 'Created' })}
              </td>
              <td>{fmtDate(wallet.createdAt)}</td>
            </tr>
            <tr>
              <td className="text-surface-500">{t('admin.detail.updated', { defaultValue: 'Updated' })}</td>
              <td>{fmtDate(wallet.updatedAt)}</td>
            </tr>
            <tr>
              <td className="text-surface-500">{t('admin.detail.expiresAt', { defaultValue: 'Expires' })}</td>
              <td>{fmtDate(wallet.expiresAt)}</td>
            </tr>
            <tr>
              <td className="text-surface-500">
                {t('admin.tempWallet.firstUsed', { defaultValue: 'First Used' })}
              </td>
              <td>{fmtDate(wallet.firstUsedAt)}</td>
            </tr>
            <tr>
              <td className="text-surface-500">
                {t('admin.tempWallet.lastAssigned', { defaultValue: 'Last Assigned' })}
              </td>
              <td>{fmtDate(wallet.lastAssignedAt)}</td>
            </tr>
            <tr>
              <td className="text-surface-500">
                {t('admin.tempWallet.lastReleased', { defaultValue: 'Last Released' })}
              </td>
              <td>{fmtDate(wallet.lastReleasedAt)}</td>
            </tr>
            <tr>
              <td className="text-surface-500">
                {t('admin.tempWallet.lastChecked', { defaultValue: 'Last Checked' })}
              </td>
              <td>{fmtDate(wallet.lastCheckedAt)}</td>
            </tr>
            <tr>
              <td className="text-surface-500">
                {t('admin.tempWallet.lastSweep', { defaultValue: 'Last Sweep' })}
              </td>
              <td>{fmtDate(wallet.lastSweepAt)}</td>
            </tr>
          </tbody>
        </Table>
      </div>
    </Card>
  )
}
