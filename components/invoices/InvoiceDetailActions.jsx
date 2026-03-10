'use client'

import { useState } from 'react'

import { useTranslation } from 'react-i18next'
import { copyToClipboard } from '@/lib/utils/clipboard'
import InvoiceStatusCard from './InvoiceStatusCard'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function InvoiceDetailActions({ invoice, explorer, effectiveStatus }) {
  const { t } = useTranslation()
  const [shareError, setShareError] = useState('')

  const buildPublicUrl = () => {
    if (!invoice?.publicCode) return ''
    if (typeof window === 'undefined') return `/pay/${invoice.publicCode}`
    return `${window.location.origin}/pay/${invoice.publicCode}`
  }

  const handleOpenPublic = () => {
    const url = buildPublicUrl()
    if (!url) return
    try {
      window.open(url, '_blank', 'noopener')
    } catch {}
  }

  const handleSharePublic = async () => {
    setShareError('')
    const url = buildPublicUrl()
    if (!url) return
    if (navigator.share) {
      try {
        await navigator.share({
          title: invoice?.invoiceNumber || 'Invoice',
          text: t('invoices.shareText') || 'Invoice payment link',
          url,
        })
      } catch (e) {
        if (e && e.name !== 'AbortError') setShareError(t('actions.shareFailed') || 'Share failed')
      }
    } else {
      try {
        await copyToClipboard(url)
        setCopiedPublic(true)
        setTimeout(() => setCopiedPublic(false), 1500)
      } catch {
        setShareError(t('actions.shareNotSupported') || 'Share not supported')
      }
    }
  }

  return (
    <div className="lg:col-span-3">
      <InvoiceStatusCard invoice={invoice} effectiveStatus={effectiveStatus} />
      <Card className="mb-4">
        <div className="p-6">
          <h6 className="mb-3 font-semibold">{t('invoices.actions') || 'Actions'}</h6>
          <div className="grid gap-2">
            {invoice.publicCode && (
              <>
                <Button
                  type="button"
                  onClick={handleOpenPublic}
                  variant="outline-primary"
                  className="bg-transparent hover:bg-primary-600 hover:text-white"
                >
                  <i className="bx bx-link-alt mr-1"></i>
                  {t('actions.openPaymentLink') || 'Open payment page'}
                </Button>
                <Button
                  type="button"
                  onClick={handleSharePublic}
                  className="border border-info-500 text-info-500 bg-transparent hover:bg-info-500 hover:text-white"
                >
                  <i className="bx bx-share-alt mr-1"></i>
                  {t('actions.share') || 'Share'}
                </Button>
              </>
            )}
            <Button
              variant="outline-secondary"
              href={
                explorer && invoice.paymentAddress
                  ? `${explorer.replace(/\/$/, '')}/address/${invoice.paymentAddress}`
                  : undefined
              }
              target={explorer ? '_blank' : undefined}
              rel={explorer ? 'noreferrer' : undefined}
            >
              <i className="bx bx-link-external mr-1"></i>
              {t('invoices.viewOnExplorer') || 'View on Explorer'}
            </Button>
          </div>
          {shareError && (
            <div className="rounded-lg bg-warning-50 dark:bg-warning-950/30 text-warning-700 dark:text-warning-400 mt-3 py-2 px-3 text-sm">
              {shareError}
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
