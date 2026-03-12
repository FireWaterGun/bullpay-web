import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import Table from '@/components/ui/Table'

export default function TempWalletSweepInfoCard({ wallet, t, onCopy, copiedId }) {
  const hasSweepInfo =
    wallet.lastSweepTxHash || wallet.lastSweepAmountRaw || wallet.lastTxHash || wallet.lastBlockNumber

  if (!hasSweepInfo) return null

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <i className="bx bx-transfer mr-2"></i>
          {t('admin.tempWallet.sweepInfo', { defaultValue: 'Sweep Info' })}
        </h5>
      </div>
      <div className="p-5">
        <Table responsive={false} className="mb-0">
          <tbody>
            {wallet.lastSweepTxHash && (
              <tr>
                <td className="text-surface-500 w-2/5">
                  {t('admin.tempWallet.sweepTxHash', { defaultValue: 'Sweep Tx Hash' })}
                </td>
                <td>
                  <div className="flex items-center">
                    <code className="text-surface-800 mr-2 text-xs break-all">
                      {wallet.lastSweepTxHash}
                    </code>
                    <Button
                      onClick={() => onCopy(wallet.lastSweepTxHash, 'sweep-tx')}
                      title={t('actions.copy', { defaultValue: 'Copy' })}
                      size="icon-sm"
                      variant="text-secondary"
                      className="shrink-0"
                    >
                      <i className={`bx ${copiedId === 'sweep-tx' ? 'bx-check text-success' : 'bx-copy'}`}></i>
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            {(wallet.lastSweepAmount || wallet.lastSweepAmountRaw) && (
              <tr>
                <td className="text-surface-500">
                  {t('admin.tempWallet.sweepAmount', { defaultValue: 'Sweep Amount' })}
                </td>
                <td>
                  <span className="font-medium">{wallet.lastSweepAmount || wallet.lastSweepAmountRaw}</span>
                  <span className="text-surface-500 ml-1 text-xs">{wallet.coinSymbol}</span>
                </td>
              </tr>
            )}
            {wallet.lastTxHash && (
              <tr>
                <td className="text-surface-500">
                  {t('admin.tempWallet.lastTxHash', { defaultValue: 'Last Tx Hash' })}
                </td>
                <td>
                  <div className="flex items-center">
                    <code className="text-surface-800 mr-2 text-xs break-all">{wallet.lastTxHash}</code>
                    <Button
                      onClick={() => onCopy(wallet.lastTxHash, 'last-tx')}
                      title={t('actions.copy', { defaultValue: 'Copy' })}
                      size="icon-sm"
                      variant="text-secondary"
                      className="shrink-0"
                    >
                      <i className={`bx ${copiedId === 'last-tx' ? 'bx-check text-success' : 'bx-copy'}`}></i>
                    </Button>
                  </div>
                </td>
              </tr>
            )}
            {wallet.lastBlockNumber && (
              <tr>
                <td className="text-surface-500">
                  {t('admin.tempWallet.lastBlockNumber', { defaultValue: 'Last Block Number' })}
                </td>
                <td className="font-medium">{wallet.lastBlockNumber}</td>
              </tr>
            )}
            {(wallet.lastLeftoverTokenAmount || wallet.lastLeftoverTokenRaw) && (
              <tr>
                <td className="text-surface-500">
                  {t('admin.tempWallet.leftoverToken', { defaultValue: 'Leftover Token' })}
                </td>
                <td>
                  <span className="font-medium">
                    {wallet.lastLeftoverTokenAmount || wallet.lastLeftoverTokenRaw}
                  </span>
                  <span className="text-surface-500 ml-1 text-xs">{wallet.coinSymbol}</span>
                </td>
              </tr>
            )}
            {(wallet.lastLeftoverNativeAmount || wallet.lastLeftoverNativeRaw) && (
              <tr>
                <td className="text-surface-500">
                  {t('admin.tempWallet.leftoverNative', { defaultValue: 'Leftover Native' })}
                </td>
                <td>
                  <span className="font-medium">
                    {wallet.lastLeftoverNativeAmount || wallet.lastLeftoverNativeRaw}
                  </span>
                </td>
              </tr>
            )}
            {wallet.lastReason && (
              <tr>
                <td className="text-surface-500">
                  {t('admin.tempWallet.lastReason', { defaultValue: 'Last Reason' })}
                </td>
                <td>{wallet.lastReason}</td>
              </tr>
            )}
            {wallet.lastSource && (
              <tr>
                <td className="text-surface-500">
                  {t('admin.tempWallet.lastSource', { defaultValue: 'Last Source' })}
                </td>
                <td>{wallet.lastSource}</td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    </Card>
  )
}
