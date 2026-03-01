import { apiFetch } from '@/lib/api-client'

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

export async function listNetworks(token?: string): Promise<Network[]> {
  const res = await apiFetch<any>(`/api/v1/networks?limit=100`, { token })

  if (Array.isArray(res)) return res as Network[]
  // Support new API structure with data.networks
  if (Array.isArray(res?.networks)) return res.networks as Network[]
  if (Array.isArray(res?.items)) return res.items as Network[]
  return []
}
