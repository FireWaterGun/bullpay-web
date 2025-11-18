import { apiFetch } from './client'
import { requestId } from '../utils/requestId'
import { extractToken } from '../utils/authToken'

export enum AddressStatus {
  PENDING_VERIFICATION = 'pending_verification',
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  DELETED = 'deleted',
}

export interface WalletRecord {
  id?: string | number
  userId?: string | number
  coinNetworkId?: number
  address?: string
  label?: string
  memo?: string | null
  status?: AddressStatus | string
  isVerified?: number
  isDefault?: number
  isLocked?: boolean
  isFlagged?: number
  usageCount?: number
  totalWithdrawn?: string
  coin?: {
    id: number
    symbol: string
    name: string
    type?: string
    decimals?: number
    logoUrl?: string
  }
  network?: {
    id: number
    symbol: string
    name: string
    chainId?: number
    explorerUrl?: string
  }
  createdAt?: string
  updatedAt?: string
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

export async function listWallets(token?: unknown, coinNetworkId?: number | string): Promise<WalletRecord[]> {
  const authHeader = toAuthHeader(token)
  const queryParams = coinNetworkId ? `?coinNetworkId=${coinNetworkId}` : ''
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawal-addresses${queryParams}`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })

  const payload = res?.data ?? res
  // Support new structure: data.addresses
  if (Array.isArray(payload?.addresses)) return payload.addresses as WalletRecord[]
  if (Array.isArray(payload?.wallets)) return payload.wallets as WalletRecord[]
  if (Array.isArray(payload?.items)) return payload.items as WalletRecord[]
  if (Array.isArray(payload)) return payload as WalletRecord[]
  if (Array.isArray(res?.results)) return res.results as WalletRecord[]
  return []
}

export async function listAllWallets(token?: unknown, pageSize = 100, coinNetworkId?: number | string): Promise<WalletRecord[]> {
  const authHeader = toAuthHeader(token)
  let page = 1
  const out: WalletRecord[] = []
  // Guard against infinite loops
  const MAX_PAGES = 50
  while (page <= MAX_PAGES) {
    const coinNetworkParam = coinNetworkId ? `&coinNetworkId=${coinNetworkId}` : ''
    const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawal-addresses?page=${page}&limit=${pageSize}${coinNetworkParam}`, {
      method: 'GET',
      headers: {
        'x-request-id': requestId(),
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
    })
    const payload = res?.data ?? res
    // Support new structure: data.addresses
    const items: WalletRecord[] = Array.isArray(payload?.addresses)
      ? payload.addresses
      : Array.isArray(payload?.wallets)
        ? payload.wallets
        : Array.isArray(payload?.items)
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
  label: string
  memo?: string
}

export async function createWallet(body: CreateWalletBody, token?: unknown): Promise<WalletRecord> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawal-addresses`, {
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
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawal-addresses/${id}`, {
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
  label?: string
  memo?: string
}

export async function updateWallet(id: number | string, body: UpdateWalletBody, token?: unknown): Promise<WalletRecord> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawal-addresses/${id}`, {
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
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawal-addresses/${id}`, {
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

export interface VerifyWalletBody {
  token: string
}

export async function verifyWalletAddress(body: VerifyWalletBody, authToken?: unknown): Promise<any> {
  const authHeader = toAuthHeader(authToken)
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawal-addresses/verify`, {
    method: 'POST',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body,
  })
  return res
}
