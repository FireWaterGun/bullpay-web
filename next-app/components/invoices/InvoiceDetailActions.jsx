'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { formatDateTime } from '@/lib/utils/format'
import { copyToClipboard } from '@/lib/utils/clipboard'
import CountdownTimer from './CountdownTimer'

export default function InvoiceDetailActions({ invoice, explorer }) {
  const { t } = useTranslation()
  const [copiedPublic, setCopiedPublic] = useState(false)
  const [shareError, setShareError] = useState('')

  const buildPublicUrl = useCallback(() => {
    if (!invoice?.publicCode) return ''
    if (typeof window === 'undefined') return `/pay/${invoice.publicCode}`
    return `${window.location.origin}/pay/${invoice.publicCode}`
  }, [invoice?.publicCode])

  const handleOpenPublic = () => {
    const url = buildPublicUrl()
    if (!url) return
    try { window.open(url, '_blank', 'noopener') } catch {}
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
    <div className="col-12 col-lg-3">
      {invoice.status === 'pending' && invoice.expiryAt && (
        <div className="card mb-4">
          <div className="card-body">
            <CountdownTimer expiryAt={invoice.expiryAt} />
          </div>
        </div>
      )}
      <div className="card mb-4">
        <div className="card-body">
          <h6 className="mb-3">{t('invoices.actions') || 'Actions'}</h6>
          <div className="d-grid gap-2">
            {invoice.publicCode && (
              <>
                <button type="button" className="btn btn-outline-primary" onClick={handleOpenPublic}>
                  <i className="bx bx-link-alt me-1"></i>
                  {t('actions.openPaymentLink') || 'Open payment page'}
                </button>
                <button type="button" className="btn btn-outline-info" onClick={handleSharePublic}>
                  <i className="bx bx-share-alt me-1"></i>
                  {t('actions.share') || 'Share'}
                </button>
              </>
            )}
            <a
              className="btn btn-outline-secondary"
              href={
                explorer && invoice.paymentAddress
                  ? `${explorer.replace(/\/$/, '')}/address/${invoice.paymentAddress}`
                  : undefined
              }
              target={explorer ? '_blank' : undefined}
              rel={explorer ? 'noreferrer' : undefined}
            >
              <i className="bx bx-link-external me-1"></i>
              {t('invoices.viewOnExplorer') || 'View on Explorer'}
            </a>
            <Link href="/invoices" className="btn btn-outline-secondary">
              <i className="bx bx-list-ul me-1"></i>
              {t('nav.history') || 'All invoices'}
            </Link>
          </div>
          {shareError && <div className="alert alert-warning mt-3 py-2 mb-0 small">{shareError}</div>}
        </div>
      </div>
      <div className="card">
        <div className="card-body">
          {invoice.publicCode && (
            <>
              <small className="text-muted d-block mb-1">{t('invoices.publicCode') || 'Public Code'}</small>
              <div className="d-flex align-items-center mb-3 gap-2">
                <code>{invoice.publicCode}</code>
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={handleOpenPublic} title={t('actions.openPaymentLink') || 'Open payment page'}>
                  <i className="bx bx-link-alt"></i>
                </button>
              </div>
            </>
          )}
          <small className="text-muted d-block mb-1">{t('invoices.createdAt') || 'Created'}</small>
          <div>{formatDateTime(invoice.createdAt || invoice.created_at)}</div>
          {invoice.expiryAt && (
            <>
              <small className="text-muted d-block mt-3 mb-1">{t('invoices.expiryAt') || 'Expires'}</small>
              <div>{formatDateTime(invoice.expiryAt)}</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
