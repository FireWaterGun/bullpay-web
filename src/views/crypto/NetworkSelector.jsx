import { useTranslation } from 'react-i18next'

export default function NetworkSelector({ networks, formData, setFormData, isEdit }) {
  const { t } = useTranslation()

  return (
    <div className="card mb-4">
      <div className="card-header">
        <h5 className="mb-0">
          <span className="badge bg-primary rounded-pill me-2">2</span>
          {isEdit ? t('crypto.network', { defaultValue: 'Network' }) : t('crypto.selectNetwork', { defaultValue: 'Select a network' })}
          <span className="text-danger ms-1">*</span>
        </h5>
      </div>
      <div className="card-body">
        {formData.coinId ? (
          <div className="d-flex flex-wrap gap-2">
            {(isEdit ? networks.filter(n => n.id === parseInt(formData.networkId)) : networks).map(network => {
              const selected = formData.networkId === String(network.id)
              return (
                <button
                  type="button"
                  key={network.id}
                  className={`btn ${selected ? 'btn-primary' : 'btn-outline-secondary'}`}
                  onClick={() => {
                    if (!isEdit) {
                      setFormData(prev => ({
                        ...prev,
                        networkId: String(network.id)
                      }))
                    }
                  }}
                  style={isEdit ? { cursor: 'default' } : {}}
                >
                  {network.symbol} - {network.name}
                </button>
              )
            })}
            {networks.length === 0 && (
              <div className="text-muted small">{t('common.noData', { defaultValue: 'No data' })}</div>
            )}
          </div>
        ) : (
          <div className="text-muted">{t('crypto.selectCoinFirst', { defaultValue: 'Please select a coin first' })}</div>
        )}
      </div>
    </div>
  )
}
