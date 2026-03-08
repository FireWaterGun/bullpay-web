'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useInvoiceEvents } from '@/hooks/useInvoiceEvents'
import { playNotificationSound } from '@/lib/utils/notification'
import { useToast } from '@/app/providers'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { isSafeRedirectUrl } from '@/lib/utils/url'

const ACTIVE_INTERVAL = 6000
const MAX_POLL_COUNT = 600 // ~1 hour at 6s intervals

/**
 * Shared base hook for both /pay and /invoice pages.
 * Handles: timer, polling, pusher events, copy, redirect, derived state.
 *
 * @param {Object} options
 * @param {Function} options.loadInitial - async () => { invoice, qr? } — called once on mount
 * @param {Function} options.loadStatus  - async () => statusData — called on poll ticks
 * @param {boolean}  options.skipPolling - if true, pauses polling (e.g. during network selection)
 */
export default function usePaymentBase({ loadInitial, loadStatus, skipPolling = false }) {
  const { t } = useTranslation()
  const toast = useToast()
  const [invoice, setInvoice] = useState(null)
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [now, setNow] = useState(Date.now())
  const [copied, setCopied] = useState(false)
  const [copiedAmt, setCopiedAmt] = useState(false)
  const [redirectCountdown, setRedirectCountdown] = useState(null)
  const pollRef = useRef(null)
  const pollCountRef = useRef(0)
  const redirectTimerRef = useRef(null)

  // -- Initial load --
  useEffect(() => {
    let cancelled = false
    async function init() {
      setLoading(true)
      setError('')
      setErrorCode('')
      try {
        const result = await loadInitial()
        if (cancelled) return
        setInvoice(result.invoice)
        if (result.qr) setQr(result.qr)
      } catch (e) {
        if (cancelled) return
        if (e?.code === 'BIZ_1200') {
          setErrorCode(e.code)
          setError(e.message || 'Invoice cancelled')
          setInvoice((prev) => (prev ? { ...prev, status: 'cancelled' } : null))
        } else {
          setError(e?.message || 'Failed to load')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [loadInitial])

  // -- Status polling --
  useEffect(() => {
    if (!invoice || errorCode === 'BIZ_1200' || skipPolling) return
    const isPaidNow = invoice.status === 'paid' || invoice.status === 'completed'
    if (isPaidNow) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }
    pollCountRef.current = 0
    pollRef.current = setInterval(async () => {
      pollCountRef.current += 1
      if (pollCountRef.current >= MAX_POLL_COUNT) {
        clearInterval(pollRef.current)
        pollRef.current = null
        return
      }
      try {
        const statusData = await loadStatus()
        if (!statusData) return
        setInvoice((prev) =>
          prev
            ? {
                ...prev,
                status: (statusData.status || '').toLowerCase(),
                paidAt: statusData.paidAt || prev.paidAt,
                paidAmount: statusData.amountReceived || statusData.paidAmount || prev.paidAmount,
                successUrl: statusData.successUrl || prev.successUrl,
                expiryAt: statusData.expiresAt || prev.expiryAt,
              }
            : prev
        )
      } catch {
        // Silently retry on next interval
      }
    }, ACTIVE_INTERVAL)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [invoice, errorCode, skipPolling, loadStatus])

  // -- Pusher events --
  useInvoiceEvents(invoice?.invoiceId || invoice?.id, {
    onPaymentReceived: (data) => {
      playNotificationSound('success')
      toast.success({
        title: t('payment.paymentReceived') || 'Payment Received',
        body: data.body || t('payment.completedSub') || 'Payment has been received',
      })
      setInvoice((prev) => (prev ? { ...prev, status: 'paid' } : prev))
    },
    onStatusChanged: (data) => {
      if (data.type === 'invoice_completed' || data.status === 'paid') {
        playNotificationSound('success')
        toast.success({
          title: t('payment.paymentReceived') || 'Invoice Paid',
          body: data.body || t('payment.completedSub') || 'Invoice has been paid successfully',
        })
        setInvoice((prev) => (prev ? { ...prev, status: 'paid' } : prev))
      } else if (data.status) {
        setInvoice((prev) => (prev ? { ...prev, status: data.status } : prev))
      }
    },
    onUpdated: (data) => {
      toast.info({
        title: data.title || t('payment.invoiceUpdated') || 'Invoice Updated',
        body: data.body || t('payment.invoiceUpdated') || 'Invoice has been updated',
      })
    },
    onPaymentCompleted: (data) => {
      playNotificationSound('success')
      toast.success({
        title: data.title || t('payment.paymentReceived') || 'Payment Completed',
        body: data.message || t('payment.completedSub') || 'Payment has been completed successfully',
      })
      setInvoice((prev) => (prev ? { ...prev, status: 'paid' } : prev))
    },
  })

  // -- 1-second clock --
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  // -- Derived state --
  const coinSym = (invoice?.coin?.symbol || invoice?.symbol || qr?.symbol || '').toUpperCase()
  const networkName = invoice?.network?.name || invoice?.networkName || qr?.network || ''
  const networkSym = (invoice?.network?.symbol || '').toUpperCase()
  const year = new Date().getFullYear()

  const expiryMs = useMemo(
    () => (invoice?.expiryAt ? new Date(String(invoice.expiryAt)).getTime() : undefined),
    [invoice?.expiryAt]
  )
  const remainingMs = expiryMs ? Math.max(0, expiryMs - now) : undefined
  const isExpired = expiryMs ? remainingMs === 0 : false

  const timerPercent = useMemo(() => {
    if (!invoice?.createdAt || !expiryMs) return undefined
    const createdMs = new Date(String(invoice.createdAt)).getTime()
    const totalMs = expiryMs - createdMs
    if (totalMs <= 0) return 0
    return Math.max(0, Math.min(100, ((expiryMs - now) / totalMs) * 100))
  }, [invoice?.createdAt, expiryMs, now])

  const isPaid =
    invoice?.status === 'paid' ||
    invoice?.status === 'completed' ||
    (Number(invoice?.paidAmount) || 0) >= (Number(invoice?.amount) || 0)
  const hasPartial = !isPaid && (Number(invoice?.paidAmount) || 0) > 0
  const currentStep = isPaid ? 3 : hasPartial ? 2 : 1

  const rawStatus = (invoice?.status || '').toLowerCase()
  const normalizedStatus = rawStatus === 'waiting' ? 'pending' : rawStatus === 'completed' ? 'paid' : rawStatus
  const uiStatus = errorCode === 'BIZ_1200' ? 'cancelled' : isExpired && !isPaid ? 'expired' : normalizedStatus

  const paymentValue = useMemo(
    () => qr?.address || invoice?.paymentAddress || '',
    [qr?.address, invoice?.paymentAddress]
  )

  const isExpiredUnpaid = isExpired && !isPaid

  // -- Actions --
  const handleCopy = useCallback(async () => {
    try {
      await copyToClipboard(invoice?.paymentAddress || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }, [invoice?.paymentAddress])

  const handleCopyAmount = useCallback(async () => {
    try {
      const val = invoice?.amount != null ? String(invoice.amount) : ''
      if (!val) return
      await copyToClipboard(val)
      setCopiedAmt(true)
      setTimeout(() => setCopiedAmt(false), 1200)
    } catch {}
  }, [invoice?.amount])

  // -- Auto-redirect countdown when paid + successUrl --
  useEffect(() => {
    if (!isPaid || !invoice?.successUrl) return
    let count = 5
    setRedirectCountdown(count)
    redirectTimerRef.current = setInterval(() => {
      count -= 1
      if (count <= 0) {
        clearInterval(redirectTimerRef.current)
        if (isSafeRedirectUrl(invoice.successUrl)) {
          window.location.href = invoice.successUrl
        }
        return
      }
      setRedirectCountdown(count)
    }, 1000)
    return () => clearInterval(redirectTimerRef.current)
  }, [isPaid, invoice?.successUrl])

  return {
    invoice,
    setInvoice,
    qr,
    loading,
    error,
    setError,
    errorCode,
    coinSym,
    networkName,
    networkSym,
    year,
    remainingMs,
    timerPercent,
    isPaid,
    hasPartial,
    isExpiredUnpaid,
    currentStep,
    uiStatus,
    paymentValue,
    copied,
    copiedAmt,
    handleCopy,
    handleCopyAmount,
    redirectCountdown,
  }
}

export function statusClass(s) {
  const v = (s || '').toLowerCase()
  if (v === 'paid') return 'bg-success'
  if (v === 'pending') return 'bg-warning'
  if (v === 'expired') return 'bg-danger'
  return 'bg-secondary'
}

export function formatDuration(ms) {
  if (ms === undefined) return '-'
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
