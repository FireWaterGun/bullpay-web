import { apiFetch } from './client'

/**
 * Get system wallet statistics (Admin only)
 * @param token - Auth token
 * @param currency - Currency code (e.g., 'USD', 'THB'), empty string for crypto amounts
 */
export async function getSystemWalletStats(token: string, currency: string = '') {
  const url = currency
    ? `/api/v1/admin/system-wallets/stats?currency=${currency}`
    : '/api/v1/admin/system-wallets/stats'

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

  const response = await apiFetch(`/api/v1/admin/coins?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  
  // Transform response structure to match component expectations
  // API returns: { data: { items: [...], meta: {...} } }
  const data = response?.data || response
  const items = data?.items || []
  const meta = data?.meta || {}

  return {
    items,
    pagination: {
      page: meta.page || 1,
      limit: meta.perPage || meta.limit || 10,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Get a single coin by ID (Admin only)
 * @param token - Auth token
 * @param id - Coin ID
 */
export async function getCoinById(token: string, id: number) {
  const data = await apiFetch(`/api/v1/admin/coins/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data?.data?.coin || data?.coin || data?.data || data
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

  const response = await apiFetch(`/api/v1/admin/networks?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  
  // Transform response structure to match component expectations
  // API returns: { data: { items: [...], meta: {...} } }
  const data = response?.data || response
  const items = data?.items || []
  const meta = data?.meta || {}

  return {
    items,
    pagination: {
      page: meta.page || 1,
      limit: meta.perPage || meta.limit || 10,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Get a single network by ID (Admin only)
 * @param token - Auth token
 * @param id - Network ID
 */
export async function getNetworkById(token: string, id: number) {
  const data = await apiFetch(`/api/v1/admin/networks/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data?.data?.network || data?.network || data?.data || data
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
  const data = await apiFetch('/api/v1/admin/networks', {
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
  const data = await apiFetch(`/api/v1/admin/networks/${id}`, {
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
  const data = await apiFetch(`/api/v1/admin/networks/${id}`, {
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

  const response = await apiFetch(`/api/v1/admin/coin-networks?${params}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  
  // Transform response structure to match component expectations
  // API returns: { data: { items: [...], meta: {...} } }
  const data = response?.data || response
  const items = data?.items || []
  const meta = data?.meta || {}

  return {
    items,
    pagination: {
      page: meta.page || 1,
      limit: meta.perPage || meta.limit || 10,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
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
  const data = await apiFetch('/api/v1/admin/coins', {
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
  const data = await apiFetch(`/api/v1/admin/coins/${id}`, {
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
  const data = await apiFetch(`/api/v1/admin/coins/${id}`, {
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
  const data = await apiFetch(`/api/v1/admin/coin-networks/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data?.data?.coinNetwork || data?.coinNetwork || data?.data || data
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
  const data = await apiFetch('/api/v1/admin/coin-networks', {
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
  const data = await apiFetch(`/api/v1/admin/coin-networks/${id}`, {
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
  const data = await apiFetch(`/api/v1/admin/coin-networks/${id}`, {
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

  const data = await apiFetch(`/api/v1/admin/settings?${params}`, {
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
  const data = await apiFetch(`/api/v1/admin/settings/${keyName}`, {
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
  const data = await apiFetch('/api/v1/admin/payments/stats', {
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
  const response = await apiFetch(`/api/v1/admin/system-wallets/${systemWalletId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  
  // Transform response structure to match component expectations
  // API returns: { data: { wallet: {...}, assets: [...], signers: [...] } }
  const data = response?.data || response
  const wallet = data?.wallet || {}
  const assets = data?.assets || []
  const signers = data?.signers || []
  
  // Extract coin/network info from first asset for backward compatibility
  const firstAsset = assets[0]
  
  return {
    ...wallet,
    assets,
    signers,
    // Add coinNetwork object from assets for component compatibility
    coinNetwork: firstAsset ? {
      id: firstAsset.coinNetworkId,
      coin: {
        symbol: firstAsset.coinSymbol
      },
      network: {
        symbol: firstAsset.networkSymbol,
        name: firstAsset.networkName
      }
    } : null
  }
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
  const url = `/api/v1/admin/system-wallets/${systemWalletId}/ledger${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  
  // Transform response structure to match component expectations
  // API returns: { success, data: { items: [...], meta: { total, page, perPage, lastPage, hasNextPage, hasPrevPage } } }
  const data = response?.data || response
  const items = data?.entries || data?.items || []
  const paginationData = data?.pagination || data?.meta || {}

  const currentPage = paginationData.page || params.page || 1
  const limit = paginationData.perPage || paginationData.limit || params.limit || 20
  const total = paginationData.total || items.length
  const totalPages = paginationData.lastPage || paginationData.totalPages || Math.ceil(total / limit) || 1

  return {
    items,
    pagination: {
      page: currentPage,
      limit: limit,
      total: total,
      totalPages: totalPages,
      currentPage: currentPage,
      from: items.length > 0 ? ((currentPage - 1) * limit) + 1 : 0,
      to: items.length > 0 ? Math.min(currentPage * limit, total) : 0,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    }
  }
}

/**
 * Get ledger entries (Admin only)
 * @param token - Auth token
 * @param params - Query parameters (page, limit, type, userId, coinNetworkId, startDate, endDate)
 */
export async function getLedgerEntries(
  token: string,
  params: {
    page?: number
    limit?: number
    type?: string
    userId?: number
    coinNetworkId?: number
    startDate?: string
    endDate?: string
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.type) queryParams.append('type', params.type)
  if (params.userId) queryParams.append('userId', String(params.userId))
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  if (params.startDate) queryParams.append('startDate', params.startDate)
  if (params.endDate) queryParams.append('endDate', params.endDate)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/ledger/entries${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  
  // Transform response structure to match component expectations
  // API returns: { data: { items: [...], meta: {...} } }
  const data = response?.data || response
  const items = data?.items || []
  const meta = data?.meta || {}

  return {
    items,
    pagination: {
      page: meta.page || 1,
      limit: meta.perPage || meta.limit || 20,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Get sweep transactions (Admin only)
 * @param token - Auth token
 * @param params - Query parameters (page, limit, status, userId, coinNetworkId, sortBy, sortOrder)
 */
export async function getSweeps(
  token: string,
  params: {
    page?: number
    limit?: number
    status?: string
    userId?: number
    coinNetworkId?: number
    startDate?: string
    endDate?: string
    sortBy?: string
    sortOrder?: string
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.status) queryParams.append('status', params.status)
  if (params.userId) queryParams.append('userId', String(params.userId))
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  if (params.startDate) queryParams.append('startDate', params.startDate)
  if (params.endDate) queryParams.append('endDate', params.endDate)
  if (params.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/sweeps${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  
  // Transform response structure to match component expectations
  // API returns: { data: { items: [...], meta: {...} } }
  const data = response?.data || response
  const items = data?.items || []
  const meta = data?.meta || {}

  return {
    items,
    pagination: {
      page: meta.page || 1,
      limit: meta.perPage || meta.limit || 20,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Get a single sweep transaction by ID (Admin only)
 * @param token - Auth token
 * @param sweepId - Sweep transaction ID
 */
export async function getSweepById(token: string, sweepId: number) {
  const response = await apiFetch(`/api/v1/admin/sweeps/${sweepId}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = response?.data || response
  return data?.sweep || data
}

/**
 * Force a sweep transaction (Admin only)
 * @param token - Auth token
 * @param sweepId - Sweep transaction ID
 */
export async function forceSweep(token: string, sweepId: number) {
  const data = await apiFetch(`/api/v1/admin/sweeps/${sweepId}/force`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data.data || data
}

/**
 * Get all withdrawal transactions (Admin only)
 * @param token - Auth token
 * @param params - Query parameters (page, limit, status, userId, coinNetworkId, search)
 */
export async function getWithdrawals(
  token: string,
  params: {
    page?: number
    limit?: number
    status?: string
    userId?: string
    coinNetworkId?: number
    search?: string
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.status) queryParams.append('status', params.status)
  if (params.userId) queryParams.append('userId', params.userId)
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  if (params.search) queryParams.append('search', params.search)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/withdrawals${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  // Transform response structure to match component expectations
  // API returns: { data: { items: [...], meta: {...} } }
  const data = response?.data || response
  const items = data?.items || []
  const meta = data?.meta || {}

  return {
    items,
    pagination: {
      page: meta.page || 1,
      limit: meta.perPage || meta.limit || 20,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Approve a withdrawal transaction
 * @param token - Auth token
 * @param withdrawalId - ID of the withdrawal to approve
 * @param reason - Optional reason for approval
 */
export async function approveWithdrawal(
  token: string,
  withdrawalId: number,
  reason?: string
) {
  const response = await apiFetch(`/api/v1/admin/withdrawals/${withdrawalId}/approve`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: reason ? { reason } : undefined
  })

  return response
}

/**
 * Reject a withdrawal transaction
 * @param token - Auth token
 * @param withdrawalId - ID of the withdrawal to reject
 * @param reason - Reason for rejection
 */
export async function rejectWithdrawal(
  token: string,
  withdrawalId: number,
  reason: string
) {
  const response = await apiFetch(`/api/v1/admin/withdrawals/${withdrawalId}/reject`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: { reason }
  })

  return response
}

/**
 * Get revenue summary (Admin only)
 * @param token - Auth token
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 */
export async function getRevenueSummary(token: string, from: string, to: string) {
  const queryParams = new URLSearchParams({ from, to })
  const response = await apiFetch(`/api/v1/admin/revenue/summary?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  return response?.data || response
}

/**
 * Get daily revenue data (Admin only)
 * @param token - Auth token
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 * @param coinNetworkId - Optional coin network ID filter
 */
export async function getRevenueDaily(token: string, from: string, to: string, coinNetworkId?: number) {
  const queryParams = new URLSearchParams({ from, to })
  if (coinNetworkId) {
    queryParams.append('coinNetworkId', String(coinNetworkId))
  }
  const response = await apiFetch(`/api/v1/admin/revenue/daily?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  return response?.data || response
}

/**
 * Get system ledger entries (Admin only)
 * @param token - Auth token
 * @param params - Query parameters (page, limit, type, walletId, coinNetworkId, entryCode, state, txHash, startDate, endDate)
 */
export async function getSystemLedgerEntries(
  token: string,
  params: {
    page?: number
    limit?: number
    type?: string
    walletId?: number
    coinNetworkId?: number
    entryCode?: string
    state?: string
    txHash?: string
    startDate?: string
    endDate?: string
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.type) queryParams.append('entryType', params.type)
  if (params.walletId) queryParams.append('walletId', String(params.walletId))
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  if (params.entryCode) queryParams.append('entryCode', params.entryCode)
  if (params.state) queryParams.append('state', params.state)
  if (params.txHash) queryParams.append('txHash', params.txHash)
  if (params.startDate) queryParams.append('startDate', params.startDate)
  if (params.endDate) queryParams.append('endDate', params.endDate)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/system-ledger${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = response?.data || response
  const items = data?.items || []
  const meta = data?.meta || data?.pagination || {}

  return {
    items,
    pagination: {
      page: meta.page || 1,
      limit: meta.perPage || meta.limit || 20,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Get system ledger entry by ID (Admin only)
 * @param token - Auth token
 * @param id - Ledger entry ID
 */
export async function getSystemLedgerEntry(token: string, id: number) {
  const response = await apiFetch(`/api/v1/admin/system-ledger/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return response?.data || response
}

/**
 * Get user ledger entries (Admin only)
 * @param token - Auth token
 * @param params - Query parameters (page, limit, type, userId, coinNetworkId, entryCode, state, startDate, endDate)
 */
export async function getUserLedgerEntries(
  token: string,
  params: {
    page?: number
    limit?: number
    type?: string
    userId?: number
    coinNetworkId?: number
    entryCode?: string
    state?: string
    startDate?: string
    endDate?: string
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.type) queryParams.append('entryType', params.type)
  if (params.userId) queryParams.append('userId', String(params.userId))
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  if (params.entryCode) queryParams.append('entryCode', params.entryCode)
  if (params.state) queryParams.append('state', params.state)
  if (params.startDate) queryParams.append('startDate', params.startDate)
  if (params.endDate) queryParams.append('endDate', params.endDate)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/user-ledger${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = response?.data || response
  const items = data?.items || []
  const meta = data?.meta || data?.pagination || {}

  return {
    items,
    pagination: {
      page: meta.page || 1,
      limit: meta.perPage || meta.limit || 20,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Get user ledger entry by ID (Admin only)
 * @param token - Auth token
 * @param id - Ledger entry ID
 */
export async function getUserLedgerEntry(token: string, id: number) {
  const response = await apiFetch(`/api/v1/admin/user-ledger/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return response?.data || response
}

/**
 * Get revenue by coin (Admin only)
 * @param token - Auth token
 * @param from - Start date (YYYY-MM-DD)
 * @param to - End date (YYYY-MM-DD)
 */
export async function getRevenueByCoin(token: string, from: string, to: string) {
  const queryParams = new URLSearchParams({ from, to })
  const response = await apiFetch(`/api/v1/admin/revenue/by-coin?${queryParams.toString()}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  return response?.data || response
}

/**
 * Get admin invoices (Admin only)
 * @param token - Auth token
 * @param params - Query parameters (page, limit, status, userId)
 */
export async function getAdminInvoices(
  token: string,
  params: {
    page?: number
    limit?: number
    status?: string
    userId?: number
    merchantId?: number
    coinNetworkId?: number
    fromDate?: string
    toDate?: string
    sortBy?: string
    sortOrder?: string
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.status) queryParams.append('status', params.status)
  if (params.userId) queryParams.append('userId', String(params.userId))
  if (params.merchantId) queryParams.append('merchantId', String(params.merchantId))
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  if (params.fromDate) queryParams.append('fromDate', params.fromDate)
  if (params.toDate) queryParams.append('toDate', params.toDate)
  if (params.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/invoices${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = response?.data || response
  const items = data?.items || []
  const meta = data?.meta || data?.pagination || {}

  return {
    items,
    pagination: {
      page: meta.page || 1,
      limit: meta.perPage || meta.limit || 20,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Get admin invoice by ID (Admin only)
 * @param token - Auth token
 * @param id - Invoice ID
 */
export async function getAdminInvoice(token: string, id: number | string) {
  const response = await apiFetch(`/api/v1/admin/invoices/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = response?.data || response
  return data?.invoice || data
}

/**
 * Get admin payments (Admin only)
 * @param token - Auth token
 * @param params - Query parameters (page, limit, status, userId)
 */
export async function getAdminPayments(
  token: string,
  params: {
    page?: number
    limit?: number
    status?: string
    userId?: number
    invoiceId?: number
    coinNetworkId?: number
    txHash?: string
    fromDate?: string
    toDate?: string
    sortBy?: string
    sortOrder?: string
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.status) queryParams.append('status', params.status)
  if (params.userId) queryParams.append('userId', String(params.userId))
  if (params.invoiceId) queryParams.append('invoiceId', String(params.invoiceId))
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  if (params.txHash) queryParams.append('txHash', params.txHash)
  if (params.fromDate) queryParams.append('fromDate', params.fromDate)
  if (params.toDate) queryParams.append('toDate', params.toDate)
  if (params.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/payments${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = response?.data || response
  const items = data?.items || []
  const meta = data?.meta || data?.pagination || {}

  return {
    items,
    pagination: {
      page: meta.page || 1,
      limit: meta.perPage || meta.limit || 20,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Get admin payment by ID (Admin only)
 * @param token - Auth token
 * @param id - Payment ID
 */
export async function getAdminPayment(token: string, id: number | string) {
  const response = await apiFetch(`/api/v1/admin/payments/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const data = response?.data || response
  return data?.payment || data
}

/**
 * Get platform ledger entries (Admin only)
 * @param token - Auth token
 * @param params - Query parameters
 */
export async function getPlatformLedgerEntries(
  token: string,
  params: {
    page?: number
    limit?: number
    accountType?: string
    coinNetworkId?: number
    entryType?: string
    entryCode?: string
    state?: string
    txHash?: string
    startDate?: string
    endDate?: string
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.accountType) queryParams.append('accountType', params.accountType)
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  if (params.entryType) queryParams.append('entryType', params.entryType)
  if (params.entryCode) queryParams.append('entryCode', params.entryCode)
  if (params.state) queryParams.append('state', params.state)
  if (params.txHash) queryParams.append('txHash', params.txHash)
  if (params.startDate) queryParams.append('startDate', params.startDate)
  if (params.endDate) queryParams.append('endDate', params.endDate)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/platform-ledger/entries${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const data = response?.data || response
  const items = data?.items || []
  const meta = data?.meta || data?.pagination || {}

  return {
    items,
    pagination: {
      page: meta.page || 1,
      limit: meta.perPage || meta.limit || 20,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Get platform ledger entry by ID (Admin only)
 * @param token - Auth token
 * @param id - Entry ID
 */
export async function getPlatformLedgerEntry(token: string, id: number) {
  const response = await apiFetch(`/api/v1/admin/platform-ledger/entries/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return response?.data || response
}

/**
 * Get income statement / P&L report (Admin only)
 * @param token - Auth token
 * @param params - Query parameters (from, to required; coinNetworkId optional)
 */
// ── Gas Topups ────────────────────────────────────────────────────

/**
 * Get all gas topups (Admin only)
 */
export async function getGasTopups(
  token: string,
  params: {
    page?: number
    limit?: number
    status?: string
    coinNetworkId?: number
    sweepId?: number
    fromAddress?: string
    dateFrom?: string
    dateTo?: string
    sortBy?: string
    sortOrder?: string
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.status) queryParams.append('status', params.status)
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  if (params.sweepId) queryParams.append('sweepId', String(params.sweepId))
  if (params.fromAddress) queryParams.append('fromAddress', params.fromAddress)
  if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
  if (params.dateTo) queryParams.append('dateTo', params.dateTo)
  if (params.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/wallet-gas-topups${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = response?.data || response
  const items = data?.items || []
  const meta = data?.meta || {}

  return {
    items,
    pagination: {
      page: meta.page || meta.currentPage || 1,
      limit: meta.perPage || meta.limit || 20,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Get gas topup by ID (Admin only)
 */
export async function getGasTopupById(token: string, id: number) {
  const response = await apiFetch(`/api/v1/admin/wallet-gas-topups/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = response?.data || response
  return data?.gasTopup || data
}

// ── Withdrawal Addresses ──────────────────────────────────────────

/**
 * Get all withdrawal addresses (Admin only)
 */
export async function getWithdrawalAddresses(
  token: string,
  params: {
    page?: number
    limit?: number
    userId?: string
    coinNetworkId?: number
    status?: string
    isFlagged?: boolean
    isVerified?: boolean
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.userId) queryParams.append('userId', params.userId)
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  if (params.status) queryParams.append('status', params.status)
  if (params.isFlagged !== undefined) queryParams.append('isFlagged', String(params.isFlagged))
  if (params.isVerified !== undefined) queryParams.append('isVerified', String(params.isVerified))

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/withdrawal-addresses${queryString ? `?${queryString}` : ''}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })

  const data = response?.data || response
  const items = data?.items || []
  const meta = data?.meta || {}

  return {
    items,
    pagination: {
      page: meta.page || meta.currentPage || 1,
      limit: meta.perPage || meta.limit || 50,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Get withdrawal address by ID (Admin only)
 */
export async function getWithdrawalAddressById(token: string, id: number) {
  const response = await apiFetch(`/api/v1/admin/withdrawal-addresses/${id}`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  })
  return response?.data || response
}

/**
 * Flag a withdrawal address (Admin only)
 */
export async function flagWithdrawalAddress(token: string, id: number, reason: string) {
  const response = await apiFetch(`/api/v1/admin/withdrawal-addresses/${id}/flag`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: { reason }
  })
  return response
}

/**
 * Unflag a withdrawal address (Admin only)
 */
export async function unflagWithdrawalAddress(token: string, id: number, reason: string) {
  const response = await apiFetch(`/api/v1/admin/withdrawal-addresses/${id}/unflag`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: { reason }
  })
  return response
}

/**
 * Force verify a withdrawal address (Admin only)
 */
export async function forceVerifyWithdrawalAddress(token: string, id: number, reason: string, skipLockPeriod?: boolean) {
  const response = await apiFetch(`/api/v1/admin/withdrawal-addresses/${id}/force-verify`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: { reason, skipLockPeriod: skipLockPeriod || false }
  })
  return response
}

/**
 * Permanently delete a withdrawal address (Admin only)
 */
export async function deleteWithdrawalAddress(token: string, id: number, reason: string) {
  const response = await apiFetch(`/api/v1/admin/withdrawal-addresses/${id}/permanent`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: { reason, confirmed: true }
  })
  return response
}

export async function getIncomeStatement(
  token: string,
  params: {
    from: string
    to: string
    coinNetworkId?: number
  }
) {
  const queryParams = new URLSearchParams()
  queryParams.append('from', params.from)
  queryParams.append('to', params.to)
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))

  const url = `/api/v1/admin/platform-ledger/income-statement?${queryParams.toString()}`

  const response = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return response?.data || response
}
