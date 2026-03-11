import Link from 'next/link'
import CoinImg from '@/components/CoinImg'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'
import { getStatusBadgeClass } from '@/lib/utils/statusBadge'

export default function TempWalletDetailsCard({ wallet, t, onCopy }) {
  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-detail mr-2"></i>
          {t('admin.tempWallet.walletDetails', { defaultValue: 'Wallet Details' })}
        </h5>
      </div>
      <div className="p-5">
        <Table responsive={false} className="mb-0">
          <tbody>
            <tr>
              <td className="text-surface-500 w-2/5">{t('admin.detail.id', { defaultValue: 'ID' })}</td>
              <td className="font-medium">{wallet.id}</td>
            </tr>
            <tr>
              <td className="text-surface-500">{t('admin.detail.status', { defaultValue: 'Status' })}</td>
              <td>
                <span className={getStatusBadgeClass(wallet.status, 'tempWallet')}>
                  {String(wallet.status || '').toUpperCase()}
                </span>
                {wallet.isExpired && (
                  <Badge color="danger" label className="ml-1">
                    {t('status.expired', { defaultValue: 'Expired' }).toUpperCase()}
                  </Badge>
                )}
              </td>
            </tr>
            <tr>
              <td className="text-surface-500">
                {t('admin.detail.invoiceId', { defaultValue: 'Invoice ID' })}
              </td>
              <td>
                {wallet.invoiceId ? (
                  <Link href={`/admin/invoices/${wallet.invoiceId}`} className="font-medium text-primary">
                    {wallet.invoiceId}
                  </Link>
                ) : (
                  <span className="text-surface-500">-</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="text-surface-500">{t('admin.detail.userId', { defaultValue: 'User ID' })}</td>
              <td className="font-medium">{wallet.userId || '-'}</td>
            </tr>
            <tr>
              <td className="text-surface-500">{t('admin.detail.coin', { defaultValue: 'Coin' })}</td>
              <td>
                <div className="flex items-center gap-2">
                  <CoinImg symbol={wallet.coinSymbol} networkSymbol={wallet.networkSymbol} size={28} />
                  <div>
                    <span className="font-semibold">{wallet.coinSymbol || '-'}</span>
                    <span className="text-surface-500 ml-1 text-[0.8rem]">
                      · {wallet.networkName || wallet.networkSymbol || '-'}
                    </span>
                  </div>
                </div>
              </td>
            </tr>
            <tr>
              <td className="text-surface-500">{t('admin.detail.decimals', { defaultValue: 'Decimals' })}</td>
              <td className="font-medium">{wallet.decimals ?? '-'}</td>
            </tr>
            <tr>
              <td className="text-surface-500">{t('admin.detail.address', { defaultValue: 'Address' })}</td>
              <td>
                {wallet.address ? (
                  <div className="flex items-center">
                    <code className="text-surface-800 mr-2 text-[0.8rem] break-all">{wallet.address}</code>
                    <Button
                      onClick={() => onCopy(wallet.address)}
                      title={t('actions.copy', { defaultValue: 'Copy' })}
                      size="icon-sm"
                      variant="text-secondary"
                      className="shrink-0"
                    >
                      <i className="bx bx-copy"></i>
                    </Button>
                    {wallet.explorerUrl && (
                      <Button
                        variant="text-primary"
                        size="icon-sm"
                        className="shrink-0"
                        href={`${wallet.explorerUrl}/address/${wallet.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}
                      >
                        <i className="bx bx-link-external"></i>
                      </Button>
                    )}
                  </div>
                ) : (
                  <span className="text-surface-500">-</span>
                )}
              </td>
            </tr>
            <tr>
              <td className="text-surface-500">
                {t('admin.tempWallet.reuseCount', { defaultValue: 'Reuse Count' })}
              </td>
              <td className="font-medium">{wallet.reuseCount ?? 0}</td>
            </tr>
            <tr>
              <td className="text-surface-500">
                {t('admin.tempWallet.totalReceived', { defaultValue: 'Total Received' })}
              </td>
              <td>
                <span className="font-medium">{wallet.totalReceivedAmount || '0'}</span>
                <span className="text-surface-500 ml-1 text-xs">{wallet.coinSymbol}</span>
              </td>
            </tr>
            <tr>
              <td className="text-surface-500">
                {t('admin.tempWallet.totalSwept', { defaultValue: 'Total Swept' })}
              </td>
              <td>
                <span className="font-medium">{wallet.totalSweptAmount || '0'}</span>
                <span className="text-surface-500 ml-1 text-xs">{wallet.coinSymbol}</span>
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    </Card>
  )
}
