import { apiFetch } from './client'
import { requestId } from '../utils/requestId'
import { extractToken } from '../utils/authToken'

function toAuthHeader(input?: unknown): string | undefined {
  if (!input) return undefined
  let token: string | undefined = typeof input === 'string' ? input : extractToken(input)
  if (!token) return undefined
  const t = token.trim()
  if (t === '[object Object]') return undefined
  if (t.startsWith('{') || t.startsWith('[')) {
    try {
      const parsed = JSON.parse(t)
      token = extractToken(parsed)
    } catch {
      return undefined
    }
  }
  return token ? `Bearer ${token}` : undefined
}

export interface CreateWithdrawalBody {
  coinNetworkId: number
  amount: string
  toAddress: string
  memo?: string
}

export async function createWithdrawal(body: CreateWithdrawalBody, token?: unknown) {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/withdrawals`, {
    method: 'POST',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body,
  })
  return res?.data?.withdrawal ?? res?.withdrawal ?? res?.data ?? res
}

export interface ListWithdrawalsParams {
  page?: number
  limit?: number
  status?: string
}

export async function listWithdrawals(params: ListWithdrawalsParams = {}, token?: unknown) {
  const { page = 1, limit = 10, status } = params
  const authHeader = toAuthHeader(token)
  const qs = new URLSearchParams()
  qs.set('page', String(page))
  qs.set('limit', String(limit))
  if (status) qs.set('status', status)
  const res = await apiFetch<any>(`/withdrawals?${qs.toString()}`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const payload = res?.data ?? res
  const items = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload)
      ? payload
      : Array.isArray(res?.results)
        ? res.results
        : []
  const pagination = payload?.pagination || null
  return { items, pagination }
}
