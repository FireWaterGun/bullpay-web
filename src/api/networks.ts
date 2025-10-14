import { apiFetch } from './client'
import { requestId } from '../utils/requestId'
import { extractToken } from '../utils/authToken'

export interface Network {
  id: number
  name: string
  symbol: string
  chainId?: number | null
  rpcUrl?: string | null
  explorerUrl?: string | null
  apiUrl?: string | null
  isTestnet: number
  gasPrice?: string | null
  confirmationBlocks: number
  status: string
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

export async function listNetworks(token?: unknown): Promise<Network[]> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/networks?limit=100`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })

  const payload = res?.data ?? res
  if (Array.isArray(payload)) return payload as Network[]
  if (Array.isArray(payload?.items)) return payload.items as Network[]
  return []
}
