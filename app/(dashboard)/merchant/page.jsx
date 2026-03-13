'use client'

import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/app/providers'
import useApi from '@/hooks/useApi'
import { getMerchantProfile, rotateSecret, regenerateKey } from '@/lib/api/merchant'
import { get2FAStatus } from '@/lib/api/twoFactor'
import { useDateFormat } from '@/hooks/useDateFormat'
import { resolveSensitiveActionError } from '@/components/merchant/merchantHelpers'
import CredentialAlert from '@/components/merchant/CredentialAlert'
import RegisterForm from '@/components/merchant/RegisterForm'
import ConfirmActionModal from '@/components/merchant/ConfirmActionModal'
import ApiCredentialsCard from '@/components/merchant/ApiCredentialsCard'
import MerchantProfileHero from '@/components/merchant/MerchantProfileHero'
import WebhookConfigCard from '@/components/merchant/WebhookConfigCard'
import QuickStartCard from '@/components/merchant/QuickStartCard'
import SecurityTipsCard from '@/components/merchant/SecurityTipsCard'
import PageSpinner from '@/components/PageSpinner'

export default function MerchantPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const { fmtDate } = useDateFormat()

  const { data: profileData, isLoading, isValidating: profileValidating, mutate: mutateProfile, token } = useApi(
    'merchant-profile',
    (token) => getMerchantProfile(token)
  )

  const { data: twoFAData, mutate: mutate2FA } = useApi(
    'merchant-2fa-status',
    (token) => get2FAStatus(token).catch(() => ({ enabled: false }))
  )

  const merchant = profileData?.merchant || profileData || null
  const apiKey = profileData?.apiKey || ''
  const apiSecretMasked = profileData?.apiSecretMasked || ''
  const is2FAEnabled = !!twoFAData?.enabled

  const [newCredentials, setNewCredentials] = useState(null)
  const [credentialWarning, setCredentialWarning] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState('')
  const [modalLoading, setModalLoading] = useState(false)
  const [modalError, setModalError] = useState('')

  function handleRegistered(result) {
    mutateProfile({
      merchant: result.merchant || result,
      apiKey: result.credentials?.apiKey || result.apiKey || '',
      apiSecretMasked: '',
    }, false)
    if (result.credentials) {
      setNewCredentials(result.credentials)
      setCredentialWarning(result.warning || '')
    }
  }

  function openModal(action) {
    setModalAction(action)
    setModalError('')
    setShowModal(true)
    mutate2FA()
  }

  function closeModal() {
    if (modalLoading) return
    setShowModal(false)
    setModalAction('')
    setModalError('')
  }

  async function handleModalConfirm({ password, totpCode } = {}) {
    try {
      setModalLoading(true)
      setModalError('')
      if (modalAction === 'rotate-secret') {
        const result = await rotateSecret(token, { password, totpCode })
        setNewCredentials({ apiSecret: result.apiSecret })
        setCredentialWarning(result.warning || '')
        toast.success(t('merchant.rotateSuccess', { defaultValue: 'API secret rotated successfully' }))
      } else if (modalAction === 'regenerate-key') {
        const result = await regenerateKey(token, { password, totpCode })
        setNewCredentials({ apiKey: result.apiKey, apiSecret: result.apiSecret })
        setCredentialWarning(result.warning || '')
        toast.success(t('merchant.regenerateSuccess', { defaultValue: 'API key & secret regenerated successfully' }))
      }
      mutateProfile()
      closeModal()
    } catch (error) {
      const resolved = resolveSensitiveActionError(t, error, {
        key: 'merchant.actionError',
        defaultValue: 'Action failed. Please try again.',
      })
      if (resolved.requires2FA) {
        mutate2FA({ enabled: true }, false)
      }
      setModalError(resolved.message)
    } finally {
      setModalLoading(false)
    }
  }

  const quickStartSteps = useMemo(
    () => [
      {
        step: 1,
        icon: 'bx-key',
        text: t('merchant.step1', { defaultValue: 'Get your API Key & Secret' }),
        done: !!apiKey,
      },
      {
        step: 2,
        icon: 'bx-broadcast',
        text: t('merchant.step2', { defaultValue: 'Configure webhook URL' }),
        done: !!merchant?.hasWebhook,
      },
      {
        step: 3,
        icon: 'bx-receipt',
        text: t('merchant.step3', { defaultValue: 'Create your first invoice' }),
        done: false,
      },
      {
        step: 4,
        icon: 'bx-wallet',
        text: t('merchant.step4', { defaultValue: 'Accept crypto payments' }),
        done: false,
      },
    ],
    [t, apiKey, merchant?.hasWebhook]
  )

  const securityTips = useMemo(
    () => [
      {
        icon: 'bx-lock-alt',
        color: 'danger',
        text: t('merchant.tip1', { defaultValue: 'Never share your API Secret publicly' }),
      },
      {
        icon: 'bx-refresh',
        color: 'warning',
        text: t('merchant.tip2', { defaultValue: 'Rotate your secret periodically' }),
      },
      {
        icon: 'bx-link',
        color: 'success',
        text: t('merchant.tip3', { defaultValue: 'Use HTTPS for all webhook URLs' }),
      },
      {
        icon: 'bx-error',
        color: 'info',
        text: t('merchant.tip4', { defaultValue: 'Regenerating key invalidates all credentials' }),
      },
    ],
    [t]
  )

  if (isLoading) {
    return <PageSpinner />
  }

  if (!merchant) {
    return <RegisterForm onRegistered={handleRegistered} token={token} t={t} />
  }

  return (
    <>
      {/* New Credential Alert */}
      {newCredentials && (
        <CredentialAlert
          credentials={newCredentials}
          warning={
            credentialWarning ||
            t('merchant.credentialWarning', {
              defaultValue: 'Store your credentials securely. They will NOT be shown again.',
            })
          }
          onDismiss={() => {
            setNewCredentials(null)
            mutateProfile()
          }}
          t={t}
        />
      )}

      {/* §1 PROFILE HERO */}
      <MerchantProfileHero
        merchant={merchant}
        loading={profileValidating}
        onRefresh={() => mutateProfile()}
        fmtDate={fmtDate}
        t={t}
      />

      {/* §2 MAIN CONTENT */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Left Column (2/3) */}
        <div className="xl:col-span-2 space-y-5">
          {/* API Credentials */}
          <ApiCredentialsCard
            apiKey={apiKey}
            apiSecretMasked={apiSecretMasked}
            onRotate={() => openModal('rotate-secret')}
            onRegenerate={() => openModal('regenerate-key')}
            toast={toast}
            t={t}
          />

          {/* Webhook Configuration */}
          <WebhookConfigCard merchant={merchant} onSaved={() => mutateProfile()} t={t} />
        </div>

        {/* Right Column (1/3) */}
        <div className="space-y-5">
          <QuickStartCard steps={quickStartSteps} t={t} />
          <SecurityTipsCard tips={securityTips} t={t} />
        </div>
      </div>

      {/* Confirm Modal */}
      {showModal && (
        <ConfirmActionModal
          action={modalAction}
          loading={modalLoading}
          is2FAEnabled={is2FAEnabled}
          onConfirm={handleModalConfirm}
          onClose={closeModal}
          error={modalError}
          t={t}
        />
      )}
    </>
  )
}
