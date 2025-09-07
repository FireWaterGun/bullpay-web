import { apiFetch } from './client'
import { requestId } from '../utils/requestId'
import { extractToken } from '../utils/authToken'

export interface WalletRecord {
  [key: string]: any
}

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

export async function listWallets(token?: unknown): Promise<WalletRecord[]> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/wallets`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })

  const payload = res?.data ?? res
  if (Array.isArray(payload)) return payload as WalletRecord[]
  if (Array.isArray(payload?.items)) return payload.items as WalletRecord[]
  if (Array.isArray(res?.results)) return res.results as WalletRecord[]
  return []
}

export async function listAllWallets(token?: unknown, pageSize = 100): Promise<WalletRecord[]> {
  const authHeader = toAuthHeader(token)
  let page = 1
  const out: WalletRecord[] = []
  // Guard against infinite loops
  const MAX_PAGES = 50
  while (page <= MAX_PAGES) {
    const res = await apiFetch<any>(`/wallets?page=${page}&limit=${pageSize}`, {
      method: 'GET',
      headers: {
        'x-request-id': requestId(),
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    })
    const payload = res?.data ?? res
    const items: WalletRecord[] = Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload)
        ? payload
        : Array.isArray(res?.results)
          ? res.results
          : []
    out.push(...items)
    if (items.length < pageSize) break
    page += 1
  }
  return out
}

export interface CreateWalletBody {
  coinNetworkId: number
  address: string
}

export async function createWallet(body: CreateWalletBody, token?: unknown): Promise<WalletRecord> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/wallets`, {
    method: 'POST',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body,
  })
  const payload = res?.data?.wallet ?? res?.wallet ?? res?.data ?? res
  if (!payload || typeof payload !== 'object') throw new Error('Invalid response')
  return payload as WalletRecord
}

export async function getWallet(id: number | string, token?: unknown): Promise<WalletRecord | null> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/wallets/${id}`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const payload = res?.data?.wallet ?? res?.wallet ?? res?.data ?? res
  return payload && typeof payload === 'object' ? (payload as WalletRecord) : null
}

export interface UpdateWalletBody {
  coinNetworkId?: number
  address?: string
}

export async function updateWallet(id: number | string, body: UpdateWalletBody, token?: unknown): Promise<WalletRecord> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/wallets/${id}`, {
    method: 'PUT',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body,
  })
  const payload = res?.data?.wallet ?? res?.wallet ?? res?.data ?? res
  if (!payload || typeof payload !== 'object') throw new Error('Invalid response')
  return payload as WalletRecord
}

export async function deleteWallet(id: number | string, token?: unknown): Promise<boolean> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/wallets/${id}`, {
    method: 'DELETE',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })
  const ok = Boolean(
    (res && (res.success === true || res.deleted === true)) ||
    (res && typeof res.status === 'string' && res.status.toLowerCase() === 'ok') ||
    (res && res.data && res.data.success === true)
  )
  return ok
}
