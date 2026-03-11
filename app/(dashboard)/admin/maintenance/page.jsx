'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useLocale } from '@/hooks/useLocale'
import { getSettingByKey, upsertSetting } from '@/lib/api/admin'
import { getSystemStatus } from '@/lib/api/system'
import { logger } from '@/lib/utils/logger'
import ConfirmModal from '@/components/ConfirmModal'
import Alert from '@/components/ui/Alert'
import Card, { CardHeader, CardBody } from '@/components/ui/Card'
import Spinner from '@/components/ui/Spinner'
import { MAINTENANCE_KEYS, getLevelOptions, isValidIp } from '@/components/admin/maintenance/maintenanceHelpers'
import LevelCard from '@/components/admin/maintenance/LevelCard'
import LevelMatrix from '@/components/admin/maintenance/LevelMatrix'
import TipsCard from '@/components/admin/maintenance/TipsCard'
import MaintenanceConfigForm from '@/components/admin/maintenance/MaintenanceConfigForm'

export default function AdminMaintenancePage() {
  const { t } = useAdminTranslation()
  const locale = useLocale()
  const { token, user } = useAuth()
  const toast = useToast()
  const toastRef = useRef(toast)
  toastRef.current = toast

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [liveStatus, setLiveStatus] = useState(null)

  // Form
  const [level, setLevel] = useState('none')
  const [messageEn, setMessageEn] = useState('')
  const [estimatedEnd, setEstimatedEnd] = useState('')
  const [allowedIps, setAllowedIps] = useState('')
  const [errors, setErrors] = useState({})

  // Quick toggle
  const [pendingToggle, setPendingToggle] = useState(null)

  /* ── Validation ── */

  const validateForm = useCallback(() => {
    const e = {}
    if (level !== 'none' && !messageEn.trim()) {
      e.messageEn = t('admin.maintenance.messageEnRequired', {
        defaultValue: 'Message is required when maintenance is active',
      })
    }
    if (estimatedEnd.trim()) {
      if (isNaN(new Date(estimatedEnd).getTime())) {
        e.estimatedEnd = t('admin.maintenance.invalidDate', { defaultValue: 'Invalid date format' })
      }
    }
    if (allowedIps.trim() && allowedIps.trim() !== '[]') {
      try {
        const parsed = JSON.parse(allowedIps)
        if (!Array.isArray(parsed)) {
          e.allowedIps = t('admin.maintenance.invalidIps', { defaultValue: 'Must be a JSON array' })
        } else {
          for (const entry of parsed) {
            if (typeof entry !== 'string' || !entry.trim()) {
              e.allowedIps = t('admin.maintenance.invalidIpEntry', {
                defaultValue: 'Each entry must be a non-empty string',
              })
              break
            }
            if (!isValidIp(entry)) {
              e.allowedIps = t('admin.maintenance.invalidIpFormat', {
                ip: entry.trim(),
                defaultValue: `"${entry.trim()}" is not a valid IPv4 or IPv6 address`,
              })
              break
            }
          }
        }
      } catch {
        e.allowedIps = t('admin.maintenance.invalidIps', { defaultValue: 'Must be valid JSON (e.g. ["1.2.3.4"])' })
      }
    }
    return e
  }, [level, messageEn, estimatedEnd, allowedIps, t])

  /* ── Data loading ── */

  const loadSettings = useCallback(
    async (silent = false) => {
      if (!token) return
      if (!silent) setLoading(true)
      try {
        const results = await Promise.all(
          MAINTENANCE_KEYS.map(async (key) => {
            try {
              const s = await getSettingByKey(token, key)
              return { key, value: s?.value ?? s?.defaultValue ?? '' }
            } catch {
              return { key, value: '' }
            }
          })
        )
        const values = Object.fromEntries(results.map(({ key, value }) => [key, value]))
        setLevel(values['maintenance.level'] || 'none')
        setMessageEn(values['maintenance.message_en'] || '')
        setEstimatedEnd(values['maintenance.estimated_end'] || '')
        setAllowedIps(values['maintenance.allowed_ips'] || '[]')
      } catch (error) {
        logger.error('Failed to load maintenance settings:', error)
        toastRef.current.error(
          t('admin.maintenance.loadError', { defaultValue: 'Failed to load maintenance settings' })
        )
      } finally {
        setLoading(false)
      }
    },
    [token, t]
  )

  const loadLiveStatus = useCallback(async () => {
    try {
      setLiveStatus(await getSystemStatus())
    } catch {
      setLiveStatus(null)
    }
  }, [])

  useEffect(() => {
    loadSettings()
    loadLiveStatus()
  }, [loadSettings, loadLiveStatus])
  useEffect(() => {
    const id = setInterval(loadLiveStatus, 15_000)
    return () => clearInterval(id)
  }, [loadLiveStatus])

  /* ── Actions ── */

  const notifyStatusChanged = () => window.dispatchEvent(new Event('maintenance-status-changed'))

  const toastResult = useCallback(
    (lv) => {
      toastRef.current.success(
        lv === 'none'
          ? t('admin.maintenance.disabled', { defaultValue: 'Maintenance mode disabled' })
          : t('admin.maintenance.enabled', { defaultValue: 'Maintenance mode activated ({level})' }).replace(
              '{level}',
              lv
            )
      )
    },
    [t]
  )

  async function handleSave() {
    if (!token) return
    const formErrors = validateForm()
    setErrors(formErrors)
    if (Object.keys(formErrors).length > 0) {
      toastRef.current.error(t('admin.maintenance.fixErrors', { defaultValue: 'Please fix the errors before saving' }))
      return
    }
    setSaving(true)
    try {
      const updates = [
        { keyName: 'maintenance.level', value: level },
        { keyName: 'maintenance.message_en', value: messageEn },
        { keyName: 'maintenance.estimated_end', value: estimatedEnd },
        { keyName: 'maintenance.allowed_ips', value: allowedIps.trim() || '[]' },
      ]
      await Promise.all(updates.map((u) => upsertSetting(token, u)))
      toastResult(level)
      notifyStatusChanged()
      await Promise.all([loadLiveStatus(), loadSettings(true)])
    } catch (error) {
      logger.error('Failed to save maintenance settings:', error)
      toastRef.current.error(t('admin.maintenance.saveError', { defaultValue: 'Failed to save maintenance settings' }))
    } finally {
      setSaving(false)
    }
  }

  async function confirmQuickToggle() {
    const newLevel = pendingToggle
    setPendingToggle(null)
    if (!newLevel || !token) return
    setLevel(newLevel)
    setSaving(true)
    try {
      await upsertSetting(token, { keyName: 'maintenance.level', value: newLevel })
      toastResult(newLevel)
      notifyStatusChanged()
      await loadLiveStatus()
    } catch (error) {
      logger.error('Quick toggle failed:', error)
      toastRef.current.error(t('admin.maintenance.saveError', { defaultValue: 'Failed to toggle maintenance mode' }))
    } finally {
      setSaving(false)
    }
  }

  /* ── Derived ── */

  const levelOptions = getLevelOptions(t)
  const currentLevelInfo = levelOptions.find((o) => o.value === level) || levelOptions[0]

  const clearError = (field) => setErrors((prev) => ({ ...prev, [field]: undefined }))

  /* ── Render ── */

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner className="text-primary" />
      </div>
    )
  }

  return (
    <div className="grow pb-6">
      {/* Page header */}
      <div className="mb-4">
        <h4 className="mb-1 text-surface-900">
          <i className="bx bx-wrench mr-2 text-warning-500" />
          {t('admin.maintenance.title', { defaultValue: 'Maintenance Mode' })}
        </h4>
        <p className="text-sm text-surface-500 mb-0">
          {t('admin.maintenance.subtitle', { defaultValue: 'Control system availability for users and merchants' })}
        </p>
      </div>

      {/* Live Status */}
      {liveStatus && (
        <Alert
          variant={liveStatus.maintenance ? (liveStatus.level === 'full' ? 'danger' : 'warning') : 'success'}
          className="flex items-center mb-4"
        >
          <i
            className={`bx ${liveStatus.maintenance ? (liveStatus.level === 'full' ? 'bx-x-circle' : 'bx-error') : 'bx-check-circle'} mr-2 text-xl`}
          />
          <div>
            <strong>{t('admin.maintenance.liveStatus', { defaultValue: 'Live Status' })}:</strong>{' '}
            {liveStatus.maintenance
              ? t('admin.maintenance.systemDown', { defaultValue: 'System is in maintenance mode ({level})' }).replace(
                  '{level}',
                  liveStatus.level
                )
              : t('admin.maintenance.systemUp', { defaultValue: 'System is operating normally' })}
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-12 gap-x-6">
        {/* Quick Toggle */}
        <div className="col-span-12 mb-4">
          <Card>
            <CardHeader>
              <h5 className="text-lg font-semibold text-surface-800 mb-0">
                {t('admin.maintenance.quickToggle', { defaultValue: 'Quick Toggle' })}
              </h5>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-12 gap-x-6 gap-3">
                {levelOptions.map((opt) => (
                  <LevelCard
                    key={opt.value}
                    opt={opt}
                    isSelected={level === opt.value}
                    onClick={() => setPendingToggle(opt.value)}
                  />
                ))}
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Configuration Form */}
        <div className="col-span-12 lg:col-span-8">
          <MaintenanceConfigForm
            t={t}
            locale={locale}
            timezone={user?.timezone}
            level={level}
            messageEn={messageEn}
            setMessageEn={setMessageEn}
            estimatedEnd={estimatedEnd}
            setEstimatedEnd={setEstimatedEnd}
            allowedIps={allowedIps}
            setAllowedIps={setAllowedIps}
            errors={errors}
            clearError={clearError}
            currentLevelInfo={currentLevelInfo}
            saving={saving}
            onSave={handleSave}
          />

        </div>

        {/* Sidebar */}
        <div className="col-span-12 lg:col-span-4">
          <Card className="mb-4">
            <CardHeader>
              <h6 className="text-lg font-semibold text-surface-800 mb-0">
                <i className="bx bx-info-circle mr-1 text-info-500" />
                {t('admin.maintenance.levelInfo', { defaultValue: 'Maintenance Levels' })}
              </h6>
            </CardHeader>
            <div className="overflow-x-auto">
              <LevelMatrix t={t} />
            </div>
          </Card>

          <TipsCard t={t} />
        </div>
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        show={pendingToggle !== null}
        title={t('admin.maintenance.confirmToggleTitle', { defaultValue: 'Change Maintenance Mode' })}
        message={
          pendingToggle === 'none'
            ? t('admin.maintenance.confirmDisable', {
                defaultValue:
                  'Are you sure you want to disable maintenance mode? The system will be fully accessible to all users.',
              })
            : pendingToggle === 'full'
              ? t('admin.maintenance.confirmFull', {
                  defaultValue:
                    'Are you sure you want to enable Full maintenance mode? All user and merchant APIs will be blocked immediately.',
                })
              : t('admin.maintenance.confirmPartial', {
                  defaultValue:
                    'Are you sure you want to enable Partial maintenance mode? User APIs and merchant write operations will be blocked.',
                })
        }
        confirmText={
          pendingToggle === 'none'
            ? t('admin.maintenance.confirmDisableBtn', { defaultValue: 'Disable Maintenance' })
            : t('admin.maintenance.confirmEnableBtn', { defaultValue: 'Enable Maintenance' })
        }
        cancelText={t('common:cancel', { defaultValue: 'Cancel' })}
        confirmVariant={pendingToggle === 'none' ? 'success' : pendingToggle === 'full' ? 'danger' : 'warning'}
        onConfirm={confirmQuickToggle}
        onCancel={() => setPendingToggle(null)}
        busy={saving}
      />
    </div>
  )
}
