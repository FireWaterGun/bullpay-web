'use client'

import { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useAuth, useToast } from '@/app/providers'
import { useUserInvoiceEvents, useSystemNotifications } from './useInvoiceEvents'
import { notifyPaymentReceived, playNotificationSound } from '@/lib/utils/notification'
import { getSystemWalletStats, getWithdrawals } from '@/lib/api/admin'
import { getBalancesWithFiat } from '@/lib/api/balance'
import { logger } from '@/lib/utils/logger'

export default function useDashboardData() {
  const { user, isAdmin, token, hasPermission, navigation } = useAuth()
  const toast = useToast()

  const [fiatBalance, setFiatBalance] = useState({ currency: 'USD', amount: '0' })
  const [pendingWithdrawalCount, setPendingWithdrawalCount] = useState(0)
  const notificationRefreshRef = useRef(null)

  const userIdentifier = user?.id || user?.userId || user?.email

  const loadPendingWithdrawalCount = useCallback(async () => {
    try {
      if (!token) return
      const data = await getWithdrawals(token, { status: 'pending', page: 1, limit: 1 })
      setPendingWithdrawalCount(data?.pagination?.total ?? 0)
    } catch (error) {
      logger.error('Failed to load pending withdrawal count:', error)
    }
  }, [token])

  const loadPaymentStats = useCallback(async () => {
    try {
      const stats = await getSystemWalletStats(token, 'USD')
      setFiatBalance({
        currency: stats?.fiat?.currency || 'USD',
        amount: stats?.fiat?.totalValueUsd || '0',
      })
    } catch (error) {
      logger.error('Failed to load system wallet stats:', error)
    }
  }, [token])

  const loadUserBalance = useCallback(async () => {
    try {
      const data = await getBalancesWithFiat(token, 'USD')
      if (data?.fiat) {
        setFiatBalance({
          currency: data.fiat.currency || 'USD',
          amount: data.fiat.amount || '0',
        })
      }
    } catch (error) {
      logger.error('Failed to load user balance:', error)
    }
  }, [token])

  // Listen for withdrawal status changes (approve/reject) to refresh badge
  useEffect(() => {
    const handler = () => {
      if (isAdmin && token && hasPermission('admin.withdrawals.view')) loadPendingWithdrawalCount()
    }
    window.addEventListener('withdrawal-status-changed', handler)
    return () => window.removeEventListener('withdrawal-status-changed', handler)
  }, [isAdmin, token, hasPermission, loadPendingWithdrawalCount])

  // Load payment stats for admin users
  useEffect(() => {
    if (!token) return
    if (isAdmin) {
      if (navigation) {
        if (hasPermission('admin.system_stats.view')) {
          queueMicrotask(() => {
            void loadPaymentStats()
          })
        }
        if (hasPermission('admin.withdrawals.view')) {
          queueMicrotask(() => {
            void loadPendingWithdrawalCount()
          })
        }
      }
    } else {
      queueMicrotask(() => {
        void loadUserBalance()
      })
    }
  }, [isAdmin, token, navigation, hasPermission, loadPaymentStats, loadPendingWithdrawalCount, loadUserBalance])

  const refreshNotifications = useCallback(() => {
    notificationRefreshRef.current?.()
  }, [])

  // Memoize Pusher event callbacks to prevent unnecessary re-subscriptions
  const pusherCallbacks = useMemo(
    () => ({
      onInvoiceCreated: (data) => {
        refreshNotifications()
        playNotificationSound('info')
        toast.info({
          title: 'New Invoice',
          body: data.body || 'A new invoice has been created',
        })
      },
      onInvoiceUpdated: (data) => {
        refreshNotifications()
        playNotificationSound('info')
        toast.info({
          title: 'Invoice Updated',
          body: data.body || 'An invoice has been updated',
        })
      },
      onStatusChanged: (data) => {
        if (data.type === 'invoice_completed' || data.status === 'paid') {
          playNotificationSound('success')
          const invoiceData = {
            id: data.invoiceId,
            invoiceNumber: data.title?.replace(/^.*#/, '') || data.invoiceId,
            ...data,
          }
          toast.success({
            title: 'Invoice Paid',
            body: data.body || 'Invoice has been paid successfully',
          })
          notifyPaymentReceived(invoiceData)
        } else {
          playNotificationSound('info')
          toast.info({
            title: 'Status Changed',
            body: data.body || `Invoice status changed to ${data.status}`,
          })
        }
        refreshNotifications()
      },
      onPaymentReceived: (data) => {
        playNotificationSound('success')
        const invoiceData = {
          id: data.invoiceId,
          invoiceNumber: data.title?.replace(/^.*#/, '') || data.invoiceId,
          ...data,
        }
        toast.success({
          title: 'Payment Received',
          body: data.body || 'Payment has been received',
        })
        notifyPaymentReceived(invoiceData)
        refreshNotifications()
      },
      onPaymentCompleted: (data) => {
        playNotificationSound('success')
        const invoiceData = {
          id: data.metadata?.referenceId,
          ...data.metadata,
          ...data,
        }
        toast.success({
          title: data.title || 'Payment Completed',
          body: data.message || 'Payment has been completed successfully',
        })
        notifyPaymentReceived(invoiceData)
        refreshNotifications()
      },
      onWithdrawalCompleted: (data) => {
        playNotificationSound('success')
        toast.success({
          title: data.title || 'Withdrawal Completed',
          body: data.message || 'Withdrawal has been completed successfully',
        })
        refreshNotifications()
        loadPendingWithdrawalCount()
      },
      onInvoiceExpired: (data) => {
        playNotificationSound('info')
        toast.warning({
          title: data.title || 'Invoice Expired',
          body: data.message || 'An invoice has expired',
        })
        refreshNotifications()
      },
      onWithdrawalApproved: (data) => {
        playNotificationSound('success')
        toast.success({
          title: data.title || 'Withdrawal Approved',
          body: data.message || 'Your withdrawal has been approved',
        })
        refreshNotifications()
        loadPendingWithdrawalCount()
      },
      onWithdrawalRejected: (data) => {
        playNotificationSound('info')
        toast.error({
          title: data.title || 'Withdrawal Rejected',
          body: data.message || data.metadata?.rejectionReason || 'Your withdrawal has been rejected',
        })
        refreshNotifications()
        loadPendingWithdrawalCount()
      },
      onMerchantApproved: (data) => {
        playNotificationSound('success')
        toast.success({
          title: data.title || 'Merchant Approved',
          body: data.message || 'Your merchant account has been approved',
        })
        refreshNotifications()
      },
      onWithdrawalAddressApproved: (data) => {
        playNotificationSound('success')
        toast.success({
          title: data.title || 'Address Approved',
          body: data.message || 'Your withdrawal address has been approved',
        })
        refreshNotifications()
      },
    }),
    [refreshNotifications, toast, loadPendingWithdrawalCount]
  )

  // Subscribe to Pusher events for real-time updates (global for all dashboard pages)
  useUserInvoiceEvents(userIdentifier, pusherCallbacks)

  // Subscribe to system notifications for admin users (sweep_completed)
  useSystemNotifications(isAdmin, {
    onSweepCompleted: (data) => {
      playNotificationSound('success')
      toast.success({
        title: data.title || 'Sweep Completed',
        body: data.message || 'Sweep has been completed successfully',
      })
      refreshNotifications()
    },
  })

  return { fiatBalance, pendingWithdrawalCount, notificationRefreshRef }
}
