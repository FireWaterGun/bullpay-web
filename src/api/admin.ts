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
 * @param page - Page number
 * @param limit - Items per page
 * @param search - Search query (coin or network name)
 * @param coin - Filter by coin symbol
 * @param network - Filter by network name
 */
export async function getCoinNetworks(token: string, page = 1, limit = 10, search = '', coin?: string, network?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  })
  
  if (search) {
    params.append('search', search)
  }
  
  if (coin) {
    params.append('coin', coin)
  }
  
  if (network) {
    params.append('network', network)
  }
  
  const data = await apiFetch(`/admin/coin-networks?${params}`, {
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

/**
 * Get coin-network by ID (Admin only)
 * @param token - Auth token
 * @param id - Coin-network ID
 */
export async function getCoinNetworkById(token: string, id: number) {
  const data = await apiFetch(`/admin/coin-networks/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}

/**
 * Create a new coin-network (Admin only)
 * @param token - Auth token
 * @param coinNetworkData - Coin-network data
 */
export async function createCoinNetwork(token: string, coinNetworkData: {
  coinId: number
  networkId: number
  contractAddress?: string
  decimals?: number
  depositEnabled: boolean
  withdrawEnabled: boolean
  minDepositAmount: string
  minWithdrawAmount: string
  maxWithdrawAmount: string
  depositFee?: string
  withdrawFee: string
  depositConfirmations: number
}) {
  const data = await apiFetch('/admin/coin-networks', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: coinNetworkData,
  })
  return data.data || data
}

/**
 * Update an existing coin-network (Admin only)
 * @param token - Auth token
 * @param id - Coin-network ID
 * @param coinNetworkData - Partial coin-network data to update
 */
export async function updateCoinNetwork(token: string, id: number, coinNetworkData: {
  coinId?: number
  networkId?: number
  contractAddress?: string
  decimals?: number
  depositEnabled?: boolean
  withdrawEnabled?: boolean
  minDepositAmount?: string
  minWithdrawAmount?: string
  maxWithdrawAmount?: string
  depositFee?: string
  withdrawFee?: string
  depositConfirmations?: number
}) {
  const data = await apiFetch(`/admin/coin-networks/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: coinNetworkData,
  })
  return data.data || data
}

/**
 * Delete a coin-network (Admin only)
 * @param token - Auth token
 * @param id - Coin-network ID
 */
export async function deleteCoinNetwork(token: string, id: number) {
  const data = await apiFetch(`/admin/coin-networks/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}

/**
 * Get sweep settings (Admin only)
 * @param token - Auth token
 * @param category - Settings category (default: 'blockchain')
 * @param scope - Settings scope (default: 'global')
 * @param page - Page number (default: 1)
 * @param limit - Items per page (default: 50)
 */
export async function getSweepSettings(
  token: string, 
  category: string = 'blockchain', 
  scope: string = 'global',
  page: number = 1,
  limit: number = 50
) {
  const params = new URLSearchParams({
    category,
    scope,
    page: page.toString(),
    limit: limit.toString(),
  })
  
  const data = await apiFetch(`/admin/settings?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}

/**
 * Update sweep setting (Admin only)
 * @param token - Auth token
 * @param keyName - Setting key name
 * @param value - New value
 */
export async function updateSweepSetting(
  token: string,
  keyName: string,
  value: any
) {
  const data = await apiFetch(`/admin/settings/${keyName}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: { value },
  })
  return data.data || data
}

/**
 * Get payment statistics (Admin only)
 * @param token - Auth token
 */
export async function getPaymentStats(token: string) {
  const data = await apiFetch('/admin/payments/stats', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}

/**
 * Get system wallet details (Admin only)
 * @param token - Auth token
 * @param systemWalletId - System wallet ID
 */
export async function getSystemWallet(
  token: string,
  systemWalletId: number
) {
  const data = await apiFetch(`/admin/system-wallets/${systemWalletId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}

/**
 * Get system wallet ledger entries (Admin only)
 * @param token - Auth token
 * @param systemWalletId - System wallet ID
 * @param params - Query parameters (page, limit, state, entryType, startDate, endDate)
 */
export async function getSystemWalletLedger(
  token: string,
  systemWalletId: number,
  params: {
    page?: number
    limit?: number
    state?: string
    entryType?: string
    startDate?: string
    endDate?: string
  } = {}
) {
  const queryParams = new URLSearchParams()
  
  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.state) queryParams.append('state', params.state)
  if (params.entryType) queryParams.append('entryType', params.entryType)
  if (params.startDate) queryParams.append('startDate', params.startDate)
  if (params.endDate) queryParams.append('endDate', params.endDate)
  
  const queryString = queryParams.toString()
  const url = `/admin/system-wallets/${systemWalletId}/ledger${queryString ? `?${queryString}` : ''}`
  
  const data = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}

/**
 * Get sweep transactions (Admin only)
 * @param token - Auth token
 * @param params - Query parameters (page, limit, status, userId, coinNetworkId)
 */
export async function getSweeps(
  token: string,
  params: {
    page?: number
    limit?: number
    status?: string
    userId?: number
    coinNetworkId?: number
  } = {}
) {
  const queryParams = new URLSearchParams()
  
  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.status) queryParams.append('status', params.status)
  if (params.userId) queryParams.append('userId', String(params.userId))
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  
  const queryString = queryParams.toString()
  const url = `/admin/sweeps${queryString ? `?${queryString}` : ''}`
  
  const data = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}

/**
 * Force a sweep transaction (Admin only)
 * @param token - Auth token
 * @param sweepId - Sweep transaction ID
 */
export async function forceSweep(token: string, sweepId: number) {
  const data = await apiFetch(`/admin/sweeps/${sweepId}/force`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}
