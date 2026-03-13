import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardBody } from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'
import LocaleDateTimePicker from '@/components/LocaleDateTimePicker'
import Spinner from '@/components/ui/Spinner'

function HintText({ children }) {
  return <p className="text-xs text-surface-500 mt-1 mb-0">{children}</p>
}

function ErrorText({ children }) {
  if (!children) return null
  return <p className="text-xs text-danger-600 dark:text-danger-400 mt-1 mb-0">{children}</p>
}

export default function MaintenanceConfigForm({
  t,
  locale,
  timezone,
  level,
  messageEn,
  setMessageEn,
  estimatedEnd,
  setEstimatedEnd,
  allowedIps,
  setAllowedIps,
  errors,
  clearError,
  currentLevelInfo,
  saving,
  onSave,
}) {
  return (
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
            {level !== 'none' ? <span className="text-danger-500"> *</span> : null}
          </Label>
          <Input
            rows={2}
            value={messageEn}
            onChange={(e) => {
              setMessageEn(e.target.value)
              clearError('messageEn')
            }}
            placeholder="System is under maintenance. Please try again later."
            maxLength={500}
            error={errors.messageEn}
          />
          <ErrorText>{errors.messageEn}</ErrorText>
        </div>

        {/* Estimated End */}
        <div className="mb-4">
          <Label>{t('admin.maintenance.estimatedEnd', { defaultValue: 'Estimated End Time' })}</Label>
          <LocaleDateTimePicker
            value={estimatedEnd}
            onChange={(v) => setEstimatedEnd(v)}
            locale={locale}
            timezone={timezone}
            placeholder={t('admin.maintenance.selectDateTime', { defaultValue: 'Select date & time' })}
            t={t}
            className="w-full"
          />
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
            maxLength={2000}
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
        <Button onClick={onSave} disabled={saving}>
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
  )
}
