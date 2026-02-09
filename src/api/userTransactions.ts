import { apiFetch } from './client'

/**
 * Get user transaction summary (KPI cards)
 * GET /api/v1/user/transactions/summary
 * @param token - Auth token
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @param coinNetworkId - Optional coin network filter
 */
export async function getUserTransactionSummary(
  token: string,
  from: string,
  to: string,
  coinNetworkId?: number
) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  if (coinNetworkId) params.append('coinNetworkId', String(coinNetworkId))

  const queryString = params.toString()
  const url = `/api/v1/user/transactions/summary${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response?.data || response
}

/**
 * Get user transaction daily trend data (chart)
 * GET /api/v1/user/transactions/daily
 * @param token - Auth token
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @param coinNetworkId - Optional coin network filter
 */
export async function getUserTransactionDaily(
  token: string,
  from: string,
  to: string,
  coinNetworkId?: number
) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  if (coinNetworkId) params.append('coinNetworkId', String(coinNetworkId))

  const queryString = params.toString()
  const url = `/api/v1/user/transactions/daily${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response?.data || response
}

/**
 * Get user transaction breakdown by coin
 * GET /api/v1/user/transactions/by-coin
 * @param token - Auth token
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @param coinNetworkId - Optional coin network filter
 */
export async function getUserTransactionByCoin(
  token: string,
  from: string,
  to: string,
  coinNetworkId?: number
) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  if (coinNetworkId) params.append('coinNetworkId', String(coinNetworkId))

  const queryString = params.toString()
  const url = `/api/v1/user/transactions/by-coin${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  return response?.data || response
}
