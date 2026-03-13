'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useAuth, useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { get2FAStatus } from '@/lib/api/twoFactor'
import { useDateFormat } from '@/hooks/useDateFormat'
import ProfileCard from './ProfileHeroCard'
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
  const [showSetupModal, setShowSetupModal] = useState(false)
  const [showDisableModal, setShowDisableModal] = useState(false)

  const { data: twoFAStatus, isLoading: twoFALoading, mutate: mutate2FA } = useApi(
    'admin-2fa-status',
    (token) => get2FAStatus(token)
  )

  const is2FAEnabled = twoFAStatus?.enabled && twoFAStatus?.verified

  return (
    <div className="grow pb-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Left Column — Profile sidebar */}
        <div className="xl:col-span-4 lg:col-span-5 col-span-12">
          <ProfileCard
            user={user}
            selectedTimezone={selectedTimezone}
            is2FAEnabled={is2FAEnabled}
            twoFALoading={twoFALoading}
            fmtDate={fmtDate}
            t={t}
          />
        </div>

        {/* Right Column — Settings cards */}
        <div className="xl:col-span-8 lg:col-span-7 col-span-12 space-y-4">
          <ChangePasswordCard token={token} is2FAEnabled={is2FAEnabled} logout={logout} toast={toast} t={t} />

          {/* Security + Timezone side-by-side */}
          <div className="grid grid-cols-12 gap-6">
            <div className="lg:col-span-6 col-span-12">
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
            <div className="lg:col-span-6 col-span-12">
              <TimezoneCard
                token={token}
                user={user}
                selectedTimezone={selectedTimezone}
                setSelectedTimezone={setSelectedTimezone}
                updateUser={updateUser}
                toast={toast}
                t={t}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2FA Modals */}
      <Setup2FAModal
        show={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        onSuccess={() => {
          toast.success(t('admin.account.twoFactorEnableSuccess', { defaultValue: '2FA enabled successfully!' }))
          mutate2FA()
        }}
        token={token}
      />
      <Disable2FAModal
        show={showDisableModal}
        onClose={() => setShowDisableModal(false)}
        onSuccess={() => {
          toast.success(t('admin.account.twoFactorDisableSuccess', { defaultValue: '2FA disabled successfully.' }))
          mutate2FA()
        }}
        token={token}
      />
    </div>
  )
}
