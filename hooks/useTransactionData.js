'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers'
import {
  getUserTransactionSummary,
  getUserTransactionDaily,
  getUserTransactionByCoin,
} from '@/lib/api/userTransactions'
import { getDateRange } from '@/lib/utils/dateRange'
import { logger } from '@/lib/utils/logger'

const LOCALE_MAP = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }

export default function useTransactionData() {
  const { token } = useAuth()
  const { i18n } = useTranslation()

  const locale = LOCALE_MAP[i18n.language] || 'en-US'

  const [datePreset, setDatePreset] = useState('thisMonth')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  const [summary, setSummary] = useState(null)
  const [dailyData, setDailyData] = useState([])
  const [dailyMeta, setDailyMeta] = useState(null)

  const [loadingSummary, setLoadingSummary] = useState(false)
  const [loadingDaily, setLoadingDaily] = useState(false)
  const [byCoinData, setByCoinData] = useState([])
  const [loadingByCoin, setLoadingByCoin] = useState(false)
  const [error, setError] = useState('')

  const dateRange = useMemo(() => {
    if (showCustom && customFrom && customTo) {
      return { from: customFrom, to: customTo }
    }
    return getDateRange(datePreset)
  }, [datePreset, showCustom, customFrom, customTo])

  const loadData = useCallback(async () => {
    if (!token || !dateRange.from || !dateRange.to) return
    setError('')
    setLoadingSummary(true)
    setLoadingDaily(true)
    setLoadingByCoin(true)

    const [summaryResult, dailyResult, byCoinResult] = await Promise.allSettled([
      getUserTransactionSummary(token, dateRange.from, dateRange.to),
      getUserTransactionDaily(token, dateRange.from, dateRange.to),
      getUserTransactionByCoin(token, dateRange.from, dateRange.to),
    ])

    if (summaryResult.status === 'fulfilled') {
      setSummary(summaryResult.value)
    } else {
      logger.error('Failed to load transaction summary:', summaryResult.reason)
      setError(summaryResult.reason?.message || 'Failed to load summary')
    }
    setLoadingSummary(false)

    if (dailyResult.status === 'fulfilled') {
      const res = dailyResult.value
      const items = res?.items || res || []
      setDailyData(
        items.map((item) => ({
          date: item.date,
          deposit: parseFloat(item.depositUsd || 0),
          withdrawal: parseFloat(item.withdrawalUsd || 0),
          netFlow: parseFloat(item.netFlowUsd || 0),
        }))
      )
      setDailyMeta(res?.meta || null)
    } else {
      logger.error('Failed to load daily data:', dailyResult.reason)
    }
    setLoadingDaily(false)

    if (byCoinResult.status === 'fulfilled') {
      const res = byCoinResult.value
      setByCoinData(res?.items || res || [])
    } else {
      logger.error('Failed to load by-coin data:', byCoinResult.reason)
    }
    setLoadingByCoin(false)
  }, [token, dateRange])

  useEffect(() => {
    let cancelled = false
    async function fetch() {
      if (!cancelled) await loadData()
    }
    fetch()
    return () => { cancelled = true }
  }, [loadData])

  const dateFilter = useMemo(
    () => ({
      datePreset,
      setDatePreset,
      customFrom,
      setCustomFrom,
      customTo,
      setCustomTo,
      showCustom,
      setShowCustom,
    }),
    [datePreset, customFrom, customTo, showCustom]
  )

  return {
    locale,
    dateRange,
    dateFilter,
    summary,
    dailyData,
    dailyMeta,
    byCoinData,
    loadingSummary,
    loadingDaily,
    loadingByCoin,
    error,
    loadData,
  }
}
