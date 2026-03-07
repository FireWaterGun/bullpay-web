'use client'

import { useTranslation } from 'react-i18next'
import CoinImg from '@/components/CoinImg'
import Badge from '../ui/Badge'
import Card from '../ui/Card'

export default function CoinSelector({ coins, formData, setFormData, isEdit }) {
  const { t } = useTranslation()

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <Badge className="bg-primary rounded-full mr-2">1</Badge>
          {isEdit
            ? t('crypto.coin', { defaultValue: 'Coin' })
            : t('crypto.selectCoin', { defaultValue: 'Select a coin' })}
          <span className="text-danger ml-1">*</span>
        </h5>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-12 gap-x-6 gap-3">
          {(isEdit ? coins.filter((c) => c.id === parseInt(formData.coinId)) : coins).map((coin) => {
            const isActive = formData.coinId === String(coin.id)
            return (
              <div className="col-span-6 sm:col-span-4 md:col-span-3" key={coin.id}>
                <div
                  role="button"
                  className={`bg-card rounded-lg shadow-card dark:shadow-card-dark h-full border-2 overflow-hidden ${isActive ? 'border-primary bg-primary-50 text-primary-600 shadow-sm' : 'border-2'}`}
                  onClick={() => {
                    if (!isEdit) {
                      setFormData((prev) => ({
                        ...prev,
                        coinId: String(coin.id),
                      }))
                    }
                  }}
                  style={isEdit ? { cursor: 'default' } : {}}
                >
                  <div className="p-3 flex items-center gap-3">
                    <CoinImg coin={coin} symbol={coin.symbol} size={40} showFallback />
                    <div className="grow min-width-0">
                      <div className="font-bold">{coin.symbol}</div>
                      <div className="text-surface-500 text-sm truncate">{coin.name}</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {coins.length === 0 && (
            <div className="col-span-12 text-surface-500">{t('common.noData', { defaultValue: 'No data' })}</div>
          )}
        </div>
      </div>
    </Card>
  )
}
