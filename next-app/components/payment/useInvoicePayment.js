'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { getPublicInvoice, getPublicInvoiceStatus, getPublicPayment, getPublicPaymentStatus, selectPaymentNetwork } from '@/lib/api/invoices'
import { useInvoiceEvents } from '@/hooks/useInvoiceEvents'
import { playNotificationSound } from '@/lib/utils/notification'
import { useToast } from '@/app/providers'
import { copyToClipboard } from '@/lib/utils/clipboard'
import { isSafeRedirectUrl } from '@/lib/utils/url'

const ACTIVE_INTERVAL = 6000
const MAX_POLL_COUNT = 600 // ~1 hour at 6s intervals

export default function useInvoicePayment() {
  const { t } = useTranslation()
  const { id: publicCode } = useParams()
  const toast = useToast()
  const [invoice, setInvoice] = useState(null)
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState('')
  const [now, setNow] = useState(Date.now())
  const [copied, setCopied] = useState(false)
  const [copiedAmt, setCopiedAmt] = useState(false)
  const pollRef = useRef(null)
  const pollCountRef = useRef(0)
  const abortRef = useRef(null)

  // Payment mode: detect pay_ prefix
  const isPaymentMode = publicCode?.startsWith('pay_')
  const [paymentData, setPaymentData] = useState(null)
  const [selectedNetwork, setSelectedNetwork] = useState(null)
  const [selectingNetwork, setSelectingNetwork] = useState(false)
  const needsNetworkSelection = isPaymentMode && paymentData && !paymentData.networkSymbol
  const [redirectCountdown, setRedirectCountdown] = useState(null)

  // Map payment API data to invoice-like structure for shared UI
  const mapPaymentToInvoice = useCallback((data) => {
    return {
      id: data.paymentId,
      invoiceId: data.paymentId,
      publicCode: data.paymentId,
      status: (data.status || '').toLowerCase(),
      expiryAt: data.expiresAt,
      amount: data.amount,
      description: data.description,
      paymentAddress: data.paymentAddress || null,
      paidAt: data.paidAt,
      paidAmount: data.paidAmount,
      merchantName: data.merchantName,
      symbol: data.coinSymbol,
      coin: data.coinSymbol ? { symbol: data.coinSymbol, name: data.coinSymbol } : undefined,
      network: data.networkSymbol
        ? { symbol: data.networkSymbol, name: data.networkName || data.networkSymbol }
        : null,
      networkName: data.networkName || data.networkSymbol || '',
      successUrl: data.successUrl,
      fiatAmount: data.fiatAmount,
      fiatCurrency: data.fiatCurrency,
    }
  }, [])

  // Load payment data (pay_ prefix)
  const loadPayment = useCallback(async (initial = false) => {
    if (!publicCode) return
    if (initial) setLoading(true)
    setError('')
    setErrorCode('')
    try {
      if (initial) {
        const data = await getPublicPayment(publicCode)
        setPaymentData(data)
        setInvoice(mapPaymentToInvoice(data))
      } else {
        const statusData = await getPublicPaymentStatus(publicCode)
        setInvoice(prev => prev ? {
          ...prev,
          status: (statusData.status || '').toLowerCase(),
          paidAt: statusData.paidAt || prev.paidAt,
          successUrl: statusData.successUrl || prev.successUrl,
        } : prev)
        setPaymentData(prev => prev ? {
          ...prev,
          status: statusData.status,
          paidAt: statusData.paidAt,
        } : prev)
      }
    } catch (e) {
      if (e?.name === 'AbortError') return
      setError(e?.message || 'Failed to load payment')
    } finally {
      if (initial) setLoading(false)
    }
  }, [publicCode, mapPaymentToInvoice])

  const loadInvoice = useCallback(async (initial = false) => {
    if (!publicCode) return
    if (initial) setLoading(true)
    setError('')
    setErrorCode('')
    try {
      if (initial) {
        if (abortRef.current) abortRef.current.abort()
        const controller = new AbortController()
        abortRef.current = controller

        const { invoice: inv, qr: qrData } = await getPublicInvoice(publicCode)

        const mapped = {
          id: inv.invoiceId ?? inv.id,
          invoiceId: inv.invoiceId ?? inv.id,
          publicCode: inv.publicCode,
          status: (inv.status || '').toLowerCase(),
          expiryAt: inv.expiresAt || inv.expiryAt,
          amount: qrData?.amount ?? inv.amount,
          description: inv.description,
          paymentAddress: qrData?.address || inv.paymentAddress,
          createdAt: inv.createdAt || inv.created_at,
          paidAmount: inv.paidAmount || inv.paid_amount,
          paidAt: inv.paidAt || inv.paid_at,
          decimals: inv.decimals,
          coin: inv.coin,
          network: inv.network,
          symbol: qrData?.symbol || inv.coin?.symbol || inv.symbol,
          networkName: qrData?.network || inv.network?.name || inv.network,
        }
        setInvoice(mapped)
        setQr(qrData)
      } else {
        const statusData = await getPublicInvoiceStatus(publicCode)
        setInvoice(prev => prev ? {
          ...prev,
          status: (statusData.status || '').toLowerCase(),
          paidAt: statusData.paidAt || prev.paidAt,
          paidAmount: statusData.amountReceived || prev.paidAmount,
          expiryAt: statusData.expiresAt || prev.expiryAt,
        } : prev)
      }
    } catch (e) {
      if (e?.name === 'AbortError') return
      if (e?.code === 'BIZ_1200') {
        setErrorCode(e.code)
        setError(e.message || 'Invoice cancelled')
        setInvoice(prev => prev ? { ...prev, status: 'cancelled' } : null)
      } else {
        setError(e?.message || 'Failed to load invoice')
      }
    } finally {
      if (initial) setLoading(false)
    }
  }, [publicCode])

  useEffect(() => {
    if (isPaymentMode) {
      loadPayment(true)
    } else {
      loadInvoice(true)
    }
  }, [isPaymentMode, loadPayment, loadInvoice])

  useEffect(() => {
    if (!invoice || errorCode === 'BIZ_1200') return
    if (needsNetworkSelection) return
    const isPaid = invoice.status === 'paid' || invoice.status === 'completed'
    if (isPaid) {
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
      return
    }
    const basePollFn = isPaymentMode ? () => loadPayment(false) : () => loadInvoice(false)
    pollCountRef.current = 0
    pollRef.current = setInterval(() => {
      pollCountRef.current += 1
      if (pollCountRef.current >= MAX_POLL_COUNT) {
        clearInterval(pollRef.current)
        pollRef.current = null
        return
      }
      basePollFn()
    }, ACTIVE_INTERVAL)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [invoice, loadInvoice, loadPayment, errorCode, isPaymentMode, needsNetworkSelection])

  // Subscribe to Pusher events
  useInvoiceEvents(invoice?.invoiceId || invoice?.id, {
    onPaymentReceived: (data) => {
      playNotificationSound('success')
      toast.success({
        title: t('payment.paymentReceived') || 'Payment Received',
        body: data.body || t('payment.completedSub') || 'Payment has been received'
      })
      setInvoice(prev => prev ? { ...prev, status: 'paid' } : prev)
      setTimeout(() => loadInvoice(false), 1000)
    },
    onStatusChanged: (data) => {
      if (data.type === 'invoice_completed' || data.status === 'paid') {
        playNotificationSound('success')
        toast.success({
          title: t('payment.paymentReceived') || 'Invoice Paid',
          body: data.body || t('payment.completedSub') || 'Invoice has been paid successfully'
        })
        setInvoice(prev => prev ? { ...prev, status: 'paid' } : prev)
      } else if (data.status) {
        setInvoice(prev => prev ? { ...prev, status: data.status } : prev)
      }
      setTimeout(() => loadInvoice(false), 1000)
    },
    onUpdated: (data) => {
      toast.info({
        title: data.title || t('payment.invoiceUpdated') || 'Invoice Updated',
        body: data.body || t('payment.invoiceUpdated') || 'Invoice has been updated'
      })
      setTimeout(() => loadInvoice(false), 1000)
    },
    onPaymentCompleted: (data) => {
      playNotificationSound('success')
      toast.success({
        title: data.title || t('payment.paymentReceived') || 'Payment Completed',
        body: data.message || t('payment.completedSub') || 'Payment has been completed successfully'
      })
      setInvoice(prev => prev ? { ...prev, status: 'paid' } : prev)
      setTimeout(() => loadInvoice(false), 1000)
    }
  })

  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(iv)
  }, [])

  // Derived state
  const coinSym = (invoice?.coin?.symbol || invoice?.symbol || qr?.symbol || '').toUpperCase()
  const networkName = invoice?.network?.name || invoice?.networkName || qr?.network || ''
  const networkSym = (invoice?.network?.symbol || '').toUpperCase()
  const year = new Date().getFullYear()

  const expiryMs = useMemo(() => invoice?.expiryAt ? new Date(String(invoice.expiryAt)).getTime() : undefined, [invoice?.expiryAt])
  const remainingMs = expiryMs ? Math.max(0, expiryMs - now) : undefined
  const isExpired = expiryMs ? remainingMs === 0 : false

  const isPaid = invoice?.status === 'paid' || invoice?.status === 'completed' || (Number(invoice?.paidAmount) || 0) >= (Number(invoice?.amount) || 0)
  const hasPartial = !isPaid && (Number(invoice?.paidAmount) || 0) > 0
  const currentStep = isPaid ? 3 : hasPartial ? 2 : 1

  // Auto-redirect countdown when paid + successUrl
  const redirectTimerRef = useRef(null)
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

  const rawStatus = (invoice?.status || '').toLowerCase()
  const normalizedStatus = rawStatus === 'waiting' ? 'pending' : rawStatus === 'completed' ? 'paid' : rawStatus
  const uiStatus = errorCode === 'BIZ_1200'
    ? 'cancelled'
    : isExpired && !isPaid
      ? 'expired'
      : normalizedStatus

  const paymentValue = useMemo(() => qr?.address || invoice?.paymentAddress || '', [qr?.address, invoice?.paymentAddress])

  const isExpiredUnpaid = isExpired && !isPaid

  const handleCopy = async () => {
    try {
      await copyToClipboard(invoice?.paymentAddress || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch { }
  }

  const handleCopyAmount = async () => {
    try {
      const val = invoice?.amount != null ? String(invoice.amount) : ''
      if (!val) return
      await copyToClipboard(val)
      setCopiedAmt(true)
      setTimeout(() => setCopiedAmt(false), 1200)
    } catch { }
  }

  const handleConfirmNetwork = async () => {
    if (!selectedNetwork || !publicCode) return
    setSelectingNetwork(true)
    try {
      const data = await selectPaymentNetwork(publicCode, selectedNetwork)
      setPaymentData(data)
      setInvoice(mapPaymentToInvoice(data))
      setSelectedNetwork(null)
    } catch (e) {
      setError(e?.message || 'Failed to select network')
    } finally {
      setSelectingNetwork(false)
    }
  }

  return {
    invoice, qr, loading, error, errorCode, paymentData,
    isPaymentMode, needsNetworkSelection,
    selectedNetwork, setSelectedNetwork, selectingNetwork, handleConfirmNetwork,
    coinSym, networkName, networkSym, year,
    remainingMs, isPaid, isExpiredUnpaid, currentStep, uiStatus,
    paymentValue, copied, copiedAmt, handleCopy, handleCopyAmount,
    redirectCountdown,
  }
}

export function statusClass(s) {
  const v = (s || "").toLowerCase()
  if (v === "paid") return "bg-success"
  if (v === "pending") return "bg-warning"
  if (v === "expired") return "bg-danger"
  return "bg-secondary"
}

export function formatDuration(ms) {
  if (ms === undefined) return "-"
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n) => String(n).padStart(2, "0")
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
