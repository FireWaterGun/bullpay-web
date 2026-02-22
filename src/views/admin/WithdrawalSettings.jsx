import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getSweepSettings, updateSweepSetting } from '../../api/admin'
import { useToastContext } from '../../context/ToastContext'
import WithdrawalDefaultsTable from './WithdrawalDefaultsTable'
import WithdrawalOverridesSection from './WithdrawalOverridesSection'
import WithdrawalSettingsCards from './WithdrawalSettingsCards'

export default function WithdrawalSettings() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToastContext()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)

  // State for all withdrawal settings
  const [defaults, setDefaults] = useState({})
  const [coinOverrides, setCoinOverrides] = useState({})
  const [networkOverrides, setNetworkOverrides] = useState({})
  const [coinNetworkOverrides, setCoinNetworkOverrides] = useState({})
  const [autoApprove, setAutoApprove] = useState({})
  const [gasSettings, setGasSettings] = useState({})
  const [policy, setPolicy] = useState({})
  const [reconciliation, setReconciliation] = useState({})
  const [reservation, setReservation] = useState({})

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      setLoadingData(true)
      const data = await getSweepSettings(token, 'payment', 'global', 1, 100)

      const settingsMap = {}
      data.forEach(setting => {
        const key = setting.keyName.replace('payment.withdraw.', '')
        settingsMap[key] = setting
      })

      setDefaults(settingsMap.defaults?.parsedValue || {})
      setCoinOverrides(settingsMap.coin_overrides?.parsedValue || {})
      setNetworkOverrides(settingsMap.network_overrides?.parsedValue || {})
      setCoinNetworkOverrides(settingsMap.coin_network_overrides?.parsedValue || {})
      setAutoApprove(settingsMap.auto_approve?.parsedValue || {})
      setGasSettings(settingsMap.gas?.parsedValue || {})
      setPolicy(settingsMap.policy?.parsedValue || {})
      setReconciliation(settingsMap.reconciliation?.parsedValue || {})
      setReservation(settingsMap.reservation?.parsedValue || {})
    } catch (error) {
      console.error('Failed to load withdrawal settings:', error)
      toast.error(t('admin.withdrawal.loadError', { defaultValue: 'Failed to load settings' }))
    } finally {
      setLoadingData(false)
    }
  }

  if (loadingData) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">{t('admin.withdrawal.title', { defaultValue: 'Withdrawal Settings' })}</h5>
              <p className="text-muted small mb-0 mt-1">
                {t('admin.withdrawal.description', { defaultValue: 'Configure withdrawal limits, fees, and policies' })}
              </p>
            </div>
            <div className="card-body">

              <WithdrawalDefaultsTable defaults={defaults} />

              <WithdrawalOverridesSection
                title={t('admin.withdrawal.coinOverrides', { defaultValue: 'Coin Overrides' })}
                badgeColor="bg-primary"
                overrides={coinOverrides}
                emptyMessageKey="admin.withdrawal.noCoinOverrides"
                emptyMessageDefault="No coin overrides configured"
                labelColumnKey="admin.withdrawal.coin"
                labelColumnDefault="Coin"
              />

              <WithdrawalOverridesSection
                title={t('admin.withdrawal.networkOverrides', { defaultValue: 'Network Overrides' })}
                badgeColor="bg-success"
                overrides={networkOverrides}
                emptyMessageKey="admin.withdrawal.noNetworkOverrides"
                emptyMessageDefault="No network overrides configured"
                labelColumnKey="admin.withdrawal.network"
                labelColumnDefault="Network"
              />

              <WithdrawalOverridesSection
                title={t('admin.withdrawal.coinNetworkOverrides', { defaultValue: 'Coin-Network Overrides' })}
                badgeColor="bg-warning"
                overrides={coinNetworkOverrides}
                emptyMessageKey="admin.withdrawal.noCoinNetworkOverrides"
                emptyMessageDefault="No coin-network overrides configured"
                labelColumnKey="admin.withdrawal.coinNetworkId"
                labelColumnDefault="CoinNetwork ID"
                showMaximum
              />

              <WithdrawalSettingsCards
                autoApprove={autoApprove}
                gasSettings={gasSettings}
                policy={policy}
                reservation={reservation}
                reconciliation={reconciliation}
              />

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
