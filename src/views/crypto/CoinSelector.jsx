import { useTranslation } from 'react-i18next'
import CoinImg from '../../components/CoinImg'

export default function CoinSelector({ coins, formData, setFormData, isEdit }) {
  const { t } = useTranslation()

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">
          <span className="badge bg-primary rounded-pill me-2">1</span>
          {isEdit ? t('crypto.coin', { defaultValue: 'Coin' }) : t('crypto.selectCoin', { defaultValue: 'Select a coin' })}
          <span className="text-danger ms-1">*</span>
        </h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          {(isEdit ? coins.filter(c => c.id === parseInt(formData.coinId)) : coins).map(coin => {
            const isActive = formData.coinId === String(coin.id)
            return (
              <div className="col-6 col-sm-4 col-md-3" key={coin.id}>
                <div
                  role="button"
                  className={`card h-100 border-2 rounded-3 overflow-hidden ${isActive ? 'border-primary bg-label-primary shadow-sm' : 'border-2'}`}
                  onClick={() => {
                    if (!isEdit) {
                      setFormData(prev => ({
                        ...prev,
                        coinId: String(coin.id)
                      }))
                    }
                  }}
                  style={isEdit ? { cursor: 'default' } : {}}
                >
                  <div className="card-body d-flex align-items-center gap-3 p-3">
                    <CoinImg coin={coin} symbol={coin.symbol} size={40} showFallback />
                    <div className="flex-grow-1 min-width-0">
                      <div className="fw-bold">{coin.symbol}</div>
                      <div className="text-muted small text-truncate">{coin.name}</div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {coins.length === 0 && (
            <div className="col-12 text-muted">{t('common.noData', { defaultValue: 'No data' })}</div>
          )}
        </div>
      </div>
    </div>
  )
}
