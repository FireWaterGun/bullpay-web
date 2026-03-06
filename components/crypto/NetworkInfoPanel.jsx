'use client';

import { useTranslation } from 'react-i18next';
import { useDateFormat } from '@/hooks/useDateFormat';
import { Badge, Card } from '../ui';

/**
 * Read-only info sidebar panel shown in edit mode.
 * Displays network metadata and supported coins list.
 */
export default function NetworkInfoPanel({ networkMeta }) {
  const { t } = useTranslation();
  const { fmtDate } = useDateFormat();

  return (
    <div className="col-span-12 xl:col-span-4">
      <Card className="mb-4">
        <h5 className="px-5 py-4 border-b border-surface-200">{t('crypto.networkInfo', { defaultValue: 'Network Info' })}</h5>
        <div className="p-5">
          <ul className="list-none mb-0">
            <li className="flex justify-between mb-3">
              <span className="text-surface-500">ID</span>
              <span className="font-medium">#{networkMeta.id}</span>
            </li>
            {networkMeta.wsUrl &&
            <li className="mb-3">
                <span className="text-surface-500 block mb-1">WebSocket URL</span>
                <code className="text-sm break-all">{networkMeta.wsUrl}</code>
              </li>
            }
            <li className="flex justify-between mb-3">
              <span className="text-surface-500">{t('crypto.coinsCount', { defaultValue: 'Supported Coins' })}</span>
              <Badge className="bg-primary-50 text-primary-600">{networkMeta.coinsCount}</Badge>
            </li>
            {networkMeta.createdAt &&
            <li className="flex justify-between mb-3">
                <span className="text-surface-500">{t('common.createdAt', { defaultValue: 'Created' })}</span>
                <span className="text-sm">{fmtDate(networkMeta.createdAt)}</span>
              </li>
            }
            {networkMeta.updatedAt &&
            <li className="flex justify-between mb-3">
                <span className="text-surface-500">{t('common.updatedAt', { defaultValue: 'Updated' })}</span>
                <span className="text-sm">{fmtDate(networkMeta.updatedAt)}</span>
              </li>
            }
          </ul>

          {/* Supported Coins List */}
          {networkMeta.supportedCoins.length > 0 &&
          <>
              <hr className="border-surface-200 my-4" />
              <h6 className="mb-3">{t('crypto.supportedCoins', { defaultValue: 'Supported Coins' })}</h6>
              <div className="divide-y divide-surface-200">
                {networkMeta.supportedCoins.map((coin) =>
              <div key={coin.id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-center">
                    <div>
                      <span className="font-medium">{coin.coinSymbol}</span>
                      <small className="text-surface-500 block">{coin.coinName}</small>
                    </div>
                    <div className="text-right">
                      <Badge color={coin.status === 'active' ? 'success' : 'secondary'} label className="mr-1">{coin.status}</Badge>
                      {coin.depositEnabled && <Badge className="bg-cyan-50 text-cyan-700 mr-1">Deposit</Badge>}
                      {coin.withdrawEnabled && <Badge className="bg-amber-50 text-amber-700">Withdraw</Badge>}
                    </div>
                  </div>
              )}
              </div>
            </>
          }
        </div>
      </Card>
    </div>);

}