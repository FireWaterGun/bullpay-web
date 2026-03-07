'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { getSettingByKey, upsertSetting } from '@/lib/api/admin'
import { getSystemStatus } from '@/lib/api/system'
import { logger } from '@/lib/utils/logger'
import ConfirmModal from '@/components/ConfirmModal'
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardBody } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'
import Table from '@/components/ui/Table'

/* ── Constants ── */

const MAINTENANCE_KEYS = [
  'maintenance.level',
  'maintenance.message_en',
  'maintenance.estimated_end',
  'maintenance.allowed_ips',
]

const LEVEL_MATRIX = [
  { label: 'User API', none: true, partial: false, full: false },
  { label: 'Merchant (GET)', none: true, partial: true, full: false },
  { label: 'Merchant (POST)', none: true, partial: false, full: false },
  { label: 'Admin API', none: true, partial: true, full: true },
  { label: 'Background Jobs', none: true, partial: true, full: true },
  { label: 'Webhooks', none: true, partial: true, full: true },
]

const LEVEL_CARD_STYLES = {
  success: {
    selected: 'border-success-500 ring-1 ring-success-500/20 shadow-md',
    icon: 'text-success-500',
    heading: '!text-success-600 dark:!text-success-400',
  },
  warning: {
    selected: 'border-warning-500 ring-1 ring-warning-500/20 shadow-md',
    icon: 'text-warning-500',
    heading: '!text-warning-600 dark:!text-warning-400',
  },
  danger: {
    selected: 'border-danger-500 ring-1 ring-danger-500/20 shadow-md',
    icon: 'text-danger-500',
    heading: '!text-danger-600 dark:!text-danger-400',
  },
}

function getLevelOptions(t) {
  return [
    {
      value: 'none',
      label: t('admin.maintenance.levelNone', { defaultValue: 'None' }),
      description: t('admin.maintenance.levelNoneDesc', { defaultValue: 'System operating normally' }),
      color: 'success',
      icon: 'bx-check-circle',
    },
    {
      value: 'partial',
      label: t('admin.maintenance.levelPartial', { defaultValue: 'Partial' }),
      description: t('admin.maintenance.levelPartialDesc', {
        defaultValue: 'Block user API + merchant write, allow merchant read + background jobs',
      }),
      color: 'warning',
      icon: 'bx-error',
    },
    {
      value: 'full',
      label: t('admin.maintenance.levelFull', { defaultValue: 'Full' }),
      description: t('admin.maintenance.levelFullDesc', { defaultValue: 'Block all APIs except admin + health check' }),
      color: 'danger',
      icon: 'bx-x-circle',
    },
  ]
}

/* ── Helpers ── */

function isValidIp(ip) {
  if (!ip || typeof ip !== 'string') return false
  const trimmed = ip.trim()
  if (!trimmed) return false
  const ipv4Re = /^(\d{1,3}\.){3}\d{1,3}$/
  if (ipv4Re.test(trimmed)) {
    return trimmed.split('.').every((o) => {
      const n = Number(o)
      return n >= 0 && n <= 255
    })
  }
  if (trimmed === '::1') return true
  return /^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/.test(trimmed)
}

function StatusIcon({ ok }) {
  return ok ? <i className="bx bx-check text-success-500" /> : <i className="bx bx-x text-danger-500" />
}

function HintText({ children }) {
  return <p className="text-xs text-surface-500 mt-1 mb-0">{children}</p>
}

function ErrorText({ children }) {
  if (!children) return null
  return <p className="text-xs text-danger-600 dark:text-danger-400 mt-1 mb-0">{children}</p>
}

/* ── Sub-components ── */

function LevelCard({ opt, isSelected, onClick }) {
  const style = LEVEL_CARD_STYLES[opt.color] || LEVEL_CARD_STYLES.success

  return (
    <div className="col-span-12 md:col-span-4">
      <div
        className={[
          'bg-card rounded-card border transition-all duration-200',
          isSelected
            ? style.selected
            : 'border-surface-200 dark:border-surface-300 shadow-card dark:shadow-card-dark hover:shadow-md cursor-pointer',
        ].join(' ')}
        onClick={!isSelected ? onClick : undefined}
      >
        <div className="py-5 text-center">
          <i className={`bx ${opt.icon} ${style.icon} mb-2 text-3xl`} />
          <h6 className={`mb-1 text-surface-800 ${isSelected ? style.heading : ''}`}>
            {opt.label}
            {isSelected && <i className="bx bx-check ml-1" />}
          </h6>
          <small className="text-surface-500 text-xs">{opt.description}</small>
        </div>
      </div>
    </div>
  )
}

function LevelMatrix({ t }) {
  return (
    <Table responsive={false} className="text-sm mb-0">
      <thead>
        <tr>
          <th>{t('admin.maintenance.component', { defaultValue: 'Component' })}</th>
          <th className="text-center">None</th>
          <th className="text-center">Partial</th>
          <th className="text-center">Full</th>
        </tr>
      </thead>
      <tbody>
        {LEVEL_MATRIX.map((row) => (
          <tr key={row.label}>
            <td>
              <small>{row.label}</small>
            </td>
            <td className="text-center">
              <StatusIcon ok={row.none} />
            </td>
            <td className="text-center">
              <StatusIcon ok={row.partial} />
            </td>
            <td className="text-center">
              <StatusIcon ok={row.full} />
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  )
}

function TipsCard({ t }) {
  const tips = [
    t('admin.maintenance.tip1', {
      defaultValue: 'Use Partial for UI/frontend updates \u2014 merchants can still check payment status.',
    }),
    t('admin.maintenance.tip2', {
      defaultValue: 'Use Full only for database migrations or critical infrastructure changes.',
    }),
    t('admin.maintenance.tip3', {
      defaultValue: 'Background jobs (watchers, sweeps, webhooks) continue running in both modes.',
    }),
    t('admin.maintenance.tip4', { defaultValue: 'Changes take effect immediately via Redis cache invalidation.' }),
  ]

  return (
    <Card>
      <CardHeader>
        <h6 className="text-lg font-semibold text-surface-800 mb-0">
          <i className="bx bx-bulb mr-1 text-warning-500" />
          {t('admin.maintenance.tips', { defaultValue: 'Tips' })}
        </h6>
      </CardHeader>
      <CardBody>
        <ul className="list-none mb-0 text-sm text-surface-600 space-y-2">
          {tips.map((tip, i) => (
            <li key={i}>
              <i className="bx bx-right-arrow-alt mr-1 text-primary-500" />
              {tip}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  )
}

/* ── Main page ── */

export default function AdminMaintenancePage() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
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
      for (const u of updates) await upsertSetting(token, u)
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
          <Card>
            <CardHeader className="flex items-center justify-between">
              <h5 className="text-lg font-semibold text-surface-800 mb-0">
                {t('admin.maintenance.configuration', { defaultValue: 'Configuration' })}
              </h5>
              <Badge color={currentLevelInfo.color} label>
                {currentLevelInfo.label}
              </Badge>
            </CardHeader>
            <CardBody>
              {/* Message */}
              <div className="mb-4">
                <Label>
                  {t('admin.maintenance.messageEn', { defaultValue: 'Message' })}
                  {level !== 'none' && <span className="text-danger-500"> *</span>}
                </Label>
                <Input
                  rows={2}
                  value={messageEn}
                  onChange={(e) => {
                    setMessageEn(e.target.value)
                    clearError('messageEn')
                  }}
                  placeholder="System is under maintenance. Please try again later."
                  error={errors.messageEn}
                />
                <ErrorText>{errors.messageEn}</ErrorText>
              </div>

              {/* Estimated End */}
              <div className="mb-4">
                <Label>{t('admin.maintenance.estimatedEnd', { defaultValue: 'Estimated End Time' })}</Label>
                <div className="grid grid-cols-12 gap-x-6 gap-2">
                  <div className="col-span-7">
                    <Input
                      type="date"
                      value={estimatedEnd ? estimatedEnd.slice(0, 10) : ''}
                      onChange={(e) => {
                        const d = e.target.value
                        if (!d) {
                          setEstimatedEnd('')
                          return
                        }
                        const time = estimatedEnd ? estimatedEnd.slice(11, 16) : '00:00'
                        setEstimatedEnd(new Date(`${d}T${time}`).toISOString())
                      }}
                    />
                  </div>
                  <div className="col-span-5">
                    <Input
                      type="time"
                      value={estimatedEnd ? estimatedEnd.slice(11, 16) : ''}
                      disabled={!estimatedEnd}
                      onChange={(e) => {
                        const time = e.target.value
                        if (!time || !estimatedEnd) return
                        setEstimatedEnd(new Date(`${estimatedEnd.slice(0, 10)}T${time}`).toISOString())
                      }}
                    />
                  </div>
                </div>
                <HintText>
                  {t('admin.maintenance.estimatedEndHelp', {
                    defaultValue: 'Leave empty if unknown. Shown to users and in Retry-After header.',
                  })}
                </HintText>
              </div>

              {/* Allowed IPs */}
              <div className="mb-5">
                <Label>{t('admin.maintenance.allowedIps', { defaultValue: 'Allowed IPs (bypass maintenance)' })}</Label>
                <Input
                  type="text"
                  value={allowedIps}
                  onChange={(e) => {
                    setAllowedIps(e.target.value)
                    clearError('allowedIps')
                  }}
                  placeholder='["1.2.3.4", "5.6.7.8"]'
                  error={errors.allowedIps}
                />
                {errors.allowedIps ? (
                  <ErrorText>{errors.allowedIps}</ErrorText>
                ) : (
                  <HintText>
                    {t('admin.maintenance.allowedIpsHelp', {
                      defaultValue: 'JSON array of IPs that can access the system during maintenance.',
                    })}
                  </HintText>
                )}
              </div>

              {/* Save */}
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Spinner aria-hidden="true" className="w-4 h-4 mr-1" />
                    {t('common.saving', { defaultValue: 'Saving...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-save mr-1" />
                    {t('admin.maintenance.saveAll', { defaultValue: 'Save Configuration' })}
                  </>
                )}
              </Button>
            </CardBody>
          </Card>
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
