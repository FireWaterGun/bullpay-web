import { apiFetch, toAuthHeader } from './client'
import { requestId } from '../utils/requestId'

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

export async function listNetworks(token?: unknown): Promise<Network[]> {
  const authHeader = toAuthHeader(token)
  const res = await apiFetch<any>(`/api/v1/networks?limit=100`, {
    method: 'GET',
    headers: {
      'x-request-id': requestId(),
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
  })

  const payload = res?.data ?? res
  if (Array.isArray(payload)) return payload as Network[]
  // Support new API structure with data.networks
  if (Array.isArray(payload?.networks)) return payload.networks as Network[]
  if (Array.isArray(payload?.items)) return payload.items as Network[]
  return []
}
