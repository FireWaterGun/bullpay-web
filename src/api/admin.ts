import { apiFetch } from './client'

/**
 * Get system wallet statistics (Admin only)
 * @param token - Auth token
 * @param currency - Currency code (e.g., 'USD', 'THB'), empty string for crypto amounts
 */
export async function getSystemWalletStats(token: string, currency: string = '') {
  const url = currency 
    ? `/admin/system-wallets/stats?currency=${currency}`
    : '/admin/system-wallets/stats'
    
  const data = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  
  // apiFetch already returns parsed JSON
  return data.data || data
}

/**
 * Get all coins (Admin only)
 * @param token - Auth token
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 * @param search - Search query for name or symbol
 */
export async function getCoins(token: string, page: number = 1, limit: number = 10, search: string = '') {
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  
  if (search && search.trim()) {
    queryParams.append('search', search.trim())
  }
  
  const data = await apiFetch(`/admin/coins?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}

/**
 * Get a single coin by ID (Admin only)
 * @param token - Auth token
 * @param id - Coin ID
 */
export async function getCoinById(token: string, id: number) {
  const data = await apiFetch(`/admin/coins/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}

/**
 * Get all networks (Admin only)
 * @param token - Auth token
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 10)
 */
export async function getNetworks(token: string, page: number = 1, limit: number = 10) {
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })
  
  const data = await apiFetch(`/admin/networks?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}

/**
 * Get a single network by ID (Admin only)
 * @param token - Auth token
 * @param id - Network ID
 */
export async function getNetworkById(token: string, id: number) {
  const data = await apiFetch(`/admin/networks/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}

/**
 * Create a new network (Admin only)
 * @param token - Auth token
 * @param networkData - Network data
 */
export async function createNetwork(token: string, networkData: {
  name: string
  symbol: string
  chainId?: number | null
  rpcUrl?: string
  explorerUrl?: string
  apiUrl?: string
  isTestnet?: boolean
  gasPrice?: string
  confirmationBlocks?: number
  status?: string
}) {
  const data = await apiFetch('/admin/networks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: networkData,
  })
  return data.data || data
}

/**
 * Update an existing network (Admin only)
 * @param token - Auth token
 * @param id - Network ID
 * @param networkData - Partial network data to update
 */
export async function updateNetwork(token: string, id: number, networkData: {
  name?: string
  symbol?: string
  chainId?: number | null
  rpcUrl?: string
  explorerUrl?: string
  apiUrl?: string
  isTestnet?: boolean
  gasPrice?: string
  confirmationBlocks?: number
  status?: string
}) {
  const data = await apiFetch(`/admin/networks/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: networkData,
  })
  return data.data || data
}

/**
 * Delete a network (Admin only)
 * @param token - Auth token
 * @param id - Network ID
 */
export async function deleteNetwork(token: string, id: number) {
  const data = await apiFetch(`/admin/networks/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}

/**
 * Get all coin-networks (Admin only)
 * @param token - Auth token
 */
export async function getCoinNetworks(token: string) {
  const data = await apiFetch('/admin/coin-networks', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}

/**
 * Create a new coin (Admin only)
 * @param token - Auth token
 * @param coinData - Coin data
 */
export async function createCoin(token: string, coinData: {
  name: string
  symbol: string
  decimals: number
  type?: string
  isStableCoin: boolean
  logoUrl?: string
  status: string
}) {
  const data = await apiFetch('/admin/coins', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: {
      ...coinData,
      type: coinData.type || 'native', // Default to 'native' if not provided
    },
  })
  return data.data || data
}

/**
 * Update an existing coin (Admin only)
 * @param token - Auth token
 * @param id - Coin ID
 * @param coinData - Partial coin data to update
 */
export async function updateCoin(token: string, id: number, coinData: {
  name?: string
  symbol?: string
  decimals?: number
  type?: string
  isStableCoin?: boolean
  logoUrl?: string
  status?: string
}) {
  const data = await apiFetch(`/admin/coins/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: coinData,
  })
  return data.data || data
}

/**
 * Delete a coin (Admin only)
 * @param token - Auth token
 * @param id - Coin ID
 */
export async function deleteCoin(token: string, id: number) {
  const data = await apiFetch(`/admin/coins/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}
