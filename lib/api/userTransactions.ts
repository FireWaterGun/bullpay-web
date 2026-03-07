import { apiFetch } from '@/lib/api-client'

export async function getUserTransactionSummary(
  token: string | null,
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

  return apiFetch(url, { token })
}

export async function getUserTransactionDaily(token: string | null, from: string, to: string, coinNetworkId?: number) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  if (coinNetworkId) params.append('coinNetworkId', String(coinNetworkId))

  const queryString = params.toString()
  const url = `/api/v1/user/transactions/daily${queryString ? `?${queryString}` : ''}`

  return apiFetch(url, { token })
}

export async function getUserTransactionByCoin(token: string | null, from: string, to: string, coinNetworkId?: number) {
  const params = new URLSearchParams()
  if (from) params.append('from', from)
  if (to) params.append('to', to)
  if (coinNetworkId) params.append('coinNetworkId', String(coinNetworkId))

  const queryString = params.toString()
  const url = `/api/v1/user/transactions/by-coin${queryString ? `?${queryString}` : ''}`

  return apiFetch(url, { token })
}
