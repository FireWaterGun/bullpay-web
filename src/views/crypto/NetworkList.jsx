import { useTranslation } from 'react-i18next'

export default function NetworkList() {
  const { t } = useTranslation()

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{t('nav.networks', { defaultValue: 'Networks' })}</h5>
          <button type="button" className="btn btn-primary">
            <i className="bx bx-plus me-1"></i>
            {t('actions.create', { defaultValue: 'Create' })}
          </button>
        </div>
        <div className="card-body">
          <div className="text-center py-6">
            <i className="bx bx-network-chart bx-lg text-muted mb-3 d-block"></i>
            <p className="text-muted mb-0">{t('crypto.networksComingSoon', { defaultValue: 'Network management coming soon' })}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
