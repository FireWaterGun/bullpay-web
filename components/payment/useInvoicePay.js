'use client'

import { useCallback } from 'react'
import { useParams } from 'next/navigation'
import { getPublicInvoice, getPublicInvoiceStatus } from '@/lib/api/invoices'
import usePaymentBase from './usePaymentBase'

/**
 * Hook for /invoice/:publicCode — direct invoice payment flow.
 * No network selection needed; invoice already exists with network assigned.
 */
export default function useInvoicePay() {
  const { id: publicCode } = useParams()

  const loadInitial = useCallback(async () => {
    if (!publicCode) throw new Error('Missing invoice code')
    const { invoice: inv, qr: qrData } = await getPublicInvoice(publicCode)
    const mapped = {
      id: inv.invoiceId ?? inv.id,
      invoiceId: inv.invoiceId ?? inv.id,
      invoiceNumber: inv.invoiceNumber,
      publicCode: inv.publicCode,
      status: (inv.status || '').toLowerCase(),
      expiryAt: inv.expiresAt || inv.expiryAt,
      amount: qrData?.amount ?? inv.amount,
      description: inv.description,
      paymentAddress: qrData?.address || inv.paymentAddress,
      createdAt: inv.createdAt || inv.created_at,
      paidAmount: inv.paidAmount || inv.paid_amount,
      remainingAmount: inv.remainingAmount,
      paidAt: inv.paidAt || inv.paid_at,
      decimals: inv.decimals,
      coin: inv.coin,
      network: inv.network,
      symbol: qrData?.symbol || inv.coin?.symbol || inv.symbol,
      networkName: qrData?.network || inv.network?.name || inv.network,
    }
    return { invoice: mapped, qr: qrData }
  }, [publicCode])

  const loadStatus = useCallback(async () => {
    if (!publicCode) return null
    return await getPublicInvoiceStatus(publicCode)
  }, [publicCode])

  const base = usePaymentBase({
    loadInitial,
    loadStatus,
    skipPolling: false,
  })

  return {
    ...base,
    // Invoice mode doesn't need these, but provide stubs for shared UI compatibility
    paymentData: null,
    needsNetworkSelection: false,
    confirmations: undefined,
  }
}
