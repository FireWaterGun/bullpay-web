import { apiFetch } from '@/lib/api-client'

export interface CoinNetworkItem {
  id: number
  coinId: number
  networkId: number
  contractAddress?: string | null
  decimals: number
  depositEnable: number
  withdrawEnable: number
  minDeposit?: string
  minWithdraw?: string
  maxWithdraw?: string
  depositFee?: string
  withdrawFee?: string
  depositConfirmations?: number
  status?: string
  createdAt?: string
  updatedAt?: string
  coin?: {
    id: number
    symbol: string
    name: string
    decimals: number
    isStableCoin?: number
    logoUrl?: string
    status?: string
    createdAt?: string
    updatedAt?: string
  }
}

export async function listCoins(token?: string): Promise<CoinNetworkItem[]> {
  const res = await apiFetch<any>(`/api/v1/coins`, { token })
  if (Array.isArray(res)) return res as CoinNetworkItem[]
  // Support new API structure with data.coins
  if (Array.isArray(res?.coins)) return res.coins as CoinNetworkItem[]
  if (Array.isArray(res?.items)) return res.items as CoinNetworkItem[]
  return []
}

export async function getCoinNetworks(coinId: number | string, token?: string): Promise<CoinNetworkItem[]> {
  const res = await apiFetch<any>(`/api/v1/coins/${coinId}/networks`, { token })
  if (Array.isArray(res)) return res as CoinNetworkItem[]
  // Support new API structure with data.coins or data.networks
  if (Array.isArray(res?.coins)) return res.coins as CoinNetworkItem[]
  if (Array.isArray(res?.networks)) return res.networks as CoinNetworkItem[]
  if (Array.isArray(res?.items)) return res.items as CoinNetworkItem[]
  return []
}

export async function getCoinNetworksBySymbol(symbol: string, token?: string): Promise<CoinNetworkItem[]> {
  const sym = encodeURIComponent(symbol)
  const res = await apiFetch<any>(`/api/v1/coins/${sym}/networks`, { token })
  if (Array.isArray(res)) return res as CoinNetworkItem[]
  // Support new API structure with data.coins or data.networks
  if (Array.isArray(res?.coins)) return res.coins as CoinNetworkItem[]
  if (Array.isArray(res?.networks)) return res.networks as CoinNetworkItem[]
  if (Array.isArray(res?.items)) return res.items as CoinNetworkItem[]
  return []
}
