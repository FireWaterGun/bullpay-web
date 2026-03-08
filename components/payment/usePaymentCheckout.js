'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { getPublicPayment, getPublicPaymentStatus, selectPaymentNetwork } from '@/lib/api/invoices'
import usePaymentBase from './usePaymentBase'

const RATE_REFRESH_INTERVAL = 30 // seconds

/**
 * Hook for /pay/:publicId — merchant hosted checkout flow.
 * Handles: network selection, rate refresh for fiat estimates.
 */
export default function usePaymentCheckout() {
  const { id: publicId } = useParams()

  const [paymentData, setPaymentData] = useState(null)
  const [selectedNetwork, setSelectedNetwork] = useState(null)
  const [selectingNetwork, setSelectingNetwork] = useState(false)
  const [isEstimate, setIsEstimate] = useState(false)
  const [rateRefreshIn, setRateRefreshIn] = useState(RATE_REFRESH_INTERVAL)
  const rateRefreshRef = useRef(null)

  const needsNetworkSelection = paymentData && !paymentData.networkSymbol

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
      network: data.networkSymbol ? { symbol: data.networkSymbol, name: data.networkName || data.networkSymbol } : null,
      networkName: data.networkName || data.networkSymbol || '',
      successUrl: data.successUrl,
      fiatAmount: data.fiatAmount,
      fiatCurrency: data.fiatCurrency,
    }
  }, [])

  const loadInitial = useCallback(async () => {
    if (!publicId) throw new Error('Missing payment ID')
    const data = await getPublicPayment(publicId)
    setPaymentData(data)
    setIsEstimate(!!data.isEstimate)
    return { invoice: mapPaymentToInvoice(data) }
  }, [publicId, mapPaymentToInvoice])

  const loadStatus = useCallback(async () => {
    if (!publicId) return null
    const statusData = await getPublicPaymentStatus(publicId)
    setPaymentData((prev) => (prev ? { ...prev, status: statusData.status, paidAt: statusData.paidAt } : prev))
    return statusData
  }, [publicId])

  const base = usePaymentBase({
    loadInitial,
    loadStatus,
    skipPolling: !!needsNetworkSelection,
  })
  const { setInvoice } = base

  // Confirmations from available networks
  const confirmations = (() => {
    if (!paymentData?.availableNetworks) return undefined
    const nw = paymentData.networkSymbol || base.invoice?.network?.symbol
    if (!nw) return undefined
    const found = paymentData.availableNetworks.find((n) => n.networkSymbol.toLowerCase() === nw.toLowerCase())
    return found?.confirmations
  })()

  // Rate refresh countdown for fiat estimate payments (30s cycle)
  useEffect(() => {
    if (!isEstimate || !needsNetworkSelection) {
      if (rateRefreshRef.current) clearInterval(rateRefreshRef.current)
      return
    }
    setRateRefreshIn(RATE_REFRESH_INTERVAL)
    rateRefreshRef.current = setInterval(async () => {
      setRateRefreshIn((prev) => {
        if (prev <= 1) {
          getPublicPayment(publicId)
            .then((data) => {
              setPaymentData(data)
              setInvoice(mapPaymentToInvoice(data))
            })
            .catch(() => {})
          return RATE_REFRESH_INTERVAL
        }
        return prev - 1
      })
    }, 1000)
    return () => {
      if (rateRefreshRef.current) clearInterval(rateRefreshRef.current)
    }
  }, [isEstimate, needsNetworkSelection, publicId, mapPaymentToInvoice, setInvoice])

  const handleConfirmNetwork = async () => {
    if (!selectedNetwork || !publicId) return
    setSelectingNetwork(true)
    try {
      const data = await selectPaymentNetwork(publicId, selectedNetwork)
      setPaymentData(data)
      base.setInvoice(mapPaymentToInvoice(data))
      setSelectedNetwork(null)
      setIsEstimate(false) // Rate is now locked
    } catch (e) {
      base.setError(e?.message || 'Failed to select network')
    } finally {
      setSelectingNetwork(false)
    }
  }

  return {
    ...base,
    paymentData,
    needsNetworkSelection,
    selectedNetwork,
    setSelectedNetwork,
    selectingNetwork,
    handleConfirmNetwork,
    confirmations,
    isEstimate,
    rateRefreshIn,
  }
}
