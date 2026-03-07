import { apiFetch } from '@/lib/api-client'

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

export async function listWallets(token?: string, coinNetworkId?: number | string): Promise<WalletRecord[]> {
  const queryParams = coinNetworkId ? `?coinNetworkId=${coinNetworkId}` : ''
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawal-addresses${queryParams}`, { token })

  // Support new structure: data.addresses
  if (Array.isArray(res?.addresses)) return res.addresses as WalletRecord[]
  if (Array.isArray(res?.wallets)) return res.wallets as WalletRecord[]
  if (Array.isArray(res?.items)) return res.items as WalletRecord[]
  if (Array.isArray(res)) return res as WalletRecord[]
  return []
}

export async function listAllWallets(
  token?: string,
  pageSize = 100,
  coinNetworkId?: number | string
): Promise<WalletRecord[]> {
  let page = 1
  const out: WalletRecord[] = []
  const MAX_PAGES = 50
  while (page <= MAX_PAGES) {
    const coinNetworkParam = coinNetworkId ? `&coinNetworkId=${coinNetworkId}` : ''
    const res = await apiFetch<any>(
      `/api/v1/user/wallet/withdrawal-addresses?page=${page}&limit=${pageSize}${coinNetworkParam}`,
      { token }
    )
    // Support new structure: data.addresses
    const items: WalletRecord[] = Array.isArray(res?.addresses)
      ? res.addresses
      : Array.isArray(res?.wallets)
        ? res.wallets
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
            ? res
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

export async function createWallet(body: CreateWalletBody, token?: string): Promise<WalletRecord> {
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawal-addresses`, {
    method: 'POST',
    token,
    body,
  })
  const payload = res?.wallet ?? res
  if (!payload || typeof payload !== 'object') throw new Error('Invalid response')
  return payload as WalletRecord
}

export async function getWallet(id: number | string, token?: string): Promise<WalletRecord | null> {
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawal-addresses/${id}`, { token })
  const payload = res?.wallet ?? res
  return payload && typeof payload === 'object' ? (payload as WalletRecord) : null
}

export interface UpdateWalletBody {
  coinNetworkId?: number
  address?: string
  label?: string
  memo?: string
}

export async function updateWallet(id: number | string, body: UpdateWalletBody, token?: string): Promise<WalletRecord> {
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawal-addresses/${id}`, {
    method: 'PUT',
    token,
    body,
  })
  const payload = res?.wallet ?? res
  if (!payload || typeof payload !== 'object') throw new Error('Invalid response')
  return payload as WalletRecord
}

export async function deleteWallet(id: number | string, token?: string): Promise<boolean> {
  const res = await apiFetch<any>(`/api/v1/user/wallet/withdrawal-addresses/${id}`, {
    method: 'DELETE',
    token,
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

export async function verifyWalletAddress(body: VerifyWalletBody, authToken?: string): Promise<any> {
  return apiFetch<any>(`/api/v1/user/wallet/withdrawal-addresses/verify`, {
    method: 'POST',
    token: authToken,
    body,
  })
}
