'use client'

import { useState, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { useAuth, useToast } from '@/app/providers'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { get2FAStatus } from '@/lib/api/twoFactor'
import { logger } from '@/lib/utils/logger'
import { useDateFormat } from '@/hooks/useDateFormat'
import ProfileHeroCard from './ProfileHeroCard'
import ChangePasswordCard from './ChangePasswordCard'
import TimezoneCard from './TimezoneCard'
import SecurityCard from './SecurityCard'

const Setup2FAModal = dynamic(() => import('@/components/TwoFactorModals').then((m) => m.Setup2FAModal), { ssr: false })
const Disable2FAModal = dynamic(() => import('@/components/TwoFactorModals').then((m) => m.Disable2FAModal), {
  ssr: false,
})

export default function AdminAccountPage() {
  const { t } = useAdminTranslation()
  const { fmtDate } = useDateFormat()
  const { token, logout, user, updateUser } = useAuth()
  const toast = useToast()

  // ── Shared state ──
  const [selectedTimezone, setSelectedTimezone] = useState(
    user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone
  )

  // ── 2FA State ──
  const [twoFAStatus, setTwoFAStatus] = useState(null)
  const [twoFALoading, setTwoFALoading] = useState(true)
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)

  const fetch2FAStatus = useCallback(async () => {
    if (!token) return
    setTwoFALoading(true)
    try {
      const res = await get2FAStatus(token)
      setTwoFAStatus(res)
    } catch (err) {
      logger.error('Failed to fetch 2FA status:', err)
    } finally {
      setTwoFALoading(false)
    }
  }, [token])

  useEffect(() => {
    fetch2FAStatus()
  }, [fetch2FAStatus])

  const is2FAEnabled = twoFAStatus?.enabled && twoFAStatus?.verified

  return (
    <div className="grow pb-6">
      {/* §1 Profile Hero */}
      <ProfileHeroCard
        user={user}
        selectedTimezone={selectedTimezone}
        is2FAEnabled={is2FAEnabled}
        twoFALoading={twoFALoading}
        t={t}
      />

      {/* §2 Main Content — Two columns on large screens */}
      <div className="grid grid-cols-12 gap-x-6">
        {/* Left Column */}
        <div className="xl:col-span-8 lg:col-span-7 col-span-12">
          <ChangePasswordCard token={token} is2FAEnabled={is2FAEnabled} logout={logout} toast={toast} t={t} />
        </div>

        {/* Right Column */}
        <div className="xl:col-span-4 lg:col-span-5 col-span-12">
          <TimezoneCard
            token={token}
            user={user}
            selectedTimezone={selectedTimezone}
            setSelectedTimezone={setSelectedTimezone}
            updateUser={updateUser}
            toast={toast}
            t={t}
          />
          <SecurityCard
            is2FAEnabled={is2FAEnabled}
            twoFALoading={twoFALoading}
            twoFAStatus={twoFAStatus}
            fmtDate={fmtDate}
            onSetup={() => setShowSetupModal(true)}
            onDisable={() => setShowDisableModal(true)}
            t={t}
          />
        </div>
      </div>

      {/* 2FA Modals */}
      <Setup2FAModal
        show={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSuccess={() => {
          toast.success(t('admin.account.twoFactorEnableSuccess', { defaultValue: '2FA enabled successfully!' }))
          fetch2FAStatus()
        }}
        token={token}
      />
      <Disable2FAModal
        show={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onSuccess={() => {
          toast.success(t('admin.account.twoFactorDisableSuccess', { defaultValue: '2FA disabled successfully.' }))
          fetch2FAStatus()
        }}
        token={token}
      />
    </div>
  )
}
