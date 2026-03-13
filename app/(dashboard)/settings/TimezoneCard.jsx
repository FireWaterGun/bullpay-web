'use client'

import { useState, useEffect } from 'react'
import { updateProfileApi } from '@/lib/api/auth'
import { COMMON_TIMEZONES } from '@/lib/constants'
import { logger } from '@/lib/utils/logger'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Label, Select } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

/**
 * Timezone selection card with live clock preview.
 */
export default function TimezoneCard({ token, user, selectedTimezone, setSelectedTimezone, updateUser, toast, t }) {
  const [savingTimezone, setSavingTimezone] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const timezoneChanged = selectedTimezone !== (user?.timezone || 'UTC')

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const handleSave = async () => {
    setSavingTimezone(true)
    try {
      await updateProfileApi(token, { timezone: selectedTimezone })
      updateUser({ timezone: selectedTimezone })
      toast.success(t('settings.timezone.saved', { defaultValue: 'Timezone updated successfully' }))
    } catch (err) {
      logger.error('Failed to update timezone:', err)
      toast.error(t('settings.timezone.failed', { defaultValue: 'Failed to update timezone' }))
    } finally {
      setSavingTimezone(false)
    }
  }

  return (
    <Card className="h-full">
      <div className="px-5 py-4 border-b border-surface-200 flex items-center">
        <span className="inline-flex items-center justify-center rounded bg-info-50 dark:bg-info-500/10 text-info-700 dark:text-info-300 mr-3 shrink-0 w-9 h-9">
          <i className="bx bx-time-five text-[1.1rem]" />
        </span>
        <div>
          <h6 className="mb-0">{t('settings.timezone.title', { defaultValue: 'Timezone' })}</h6>
          <small className="text-surface-500">
            {t('settings.timezone.description', {
              defaultValue: 'Set your preferred timezone for displaying dates and times.',
            })}
          </small>
        </div>
      </div>

      <div className="px-5 py-3">
        {/* Live clock — compact inline */}
        <div
          className="flex items-center justify-between mb-3 py-2 px-3 rounded-lg bg-blue-500/[0.06]"
        >
          <span className="font-bold text-xl text-primary tabular-nums tracking-wider">
            {now.toLocaleString(undefined, {
              timeZone: selectedTimezone,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })}
          </span>
          <small className="text-surface-500">{selectedTimezone.replace(/_/g, ' ')}</small>
        </div>

        <div className="mb-3">
          <Label htmlFor="timezone">{t('settings.timezone.label', { defaultValue: 'Timezone' })}</Label>
          <Select id="timezone" value={selectedTimezone} onChange={(e) => setSelectedTimezone(e.target.value)}>
            {COMMON_TIMEZONES.map((tz) => (
              <option key={tz.value} value={tz.value}>
                {tz.label}
              </option>
            ))}
          </Select>
        </div>

        <Button type="button" disabled={savingTimezone || !timezoneChanged} onClick={handleSave} className="w-full">
          {savingTimezone ? (
            <>
              <Spinner className="w-4 h-4 mr-2" />
              {t('common.saving', { defaultValue: 'Saving...' })}
            </>
          ) : (
            <>
              <i className="bx bx-check mr-1" />
              {t('common.save', { defaultValue: 'Save' })}
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
