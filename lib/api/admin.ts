import { apiFetch } from '@/lib/api-client'

/**
 * Get system wallet statistics (Admin only)
 */
export async function getSystemWalletStats(token: string | null, currency: string = '') {
  const url = currency
    ? `/api/v1/admin/system-wallets/stats?currency=${currency}`
    : '/api/v1/admin/system-wallets/stats'

  return apiFetch(url, { token })
}

/**
 * Get all coins (Admin only)
 */
export async function getCoins(token: string | null, page: number = 1, limit: number = 10, search: string = '') {
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  if (search && search.trim()) {
    queryParams.append('search', search.trim())
  }

  const data = await apiFetch<any>(`/api/v1/admin/coins?${queryParams.toString()}`, { token })

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
 */
export async function getCoinById(token: string | null, id: number) {
  const data = await apiFetch<any>(`/api/v1/admin/coins/${id}`, { token })
  return data?.coin || data
}

/**
 * Get all networks (Admin only)
 */
export async function getNetworks(token: string | null, page: number = 1, limit: number = 10) {
  const queryParams = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  })

  const data = await apiFetch<any>(`/api/v1/admin/networks?${queryParams.toString()}`, { token })

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
 */
export async function getNetworkById(token: string | null, id: number) {
  const data = await apiFetch<any>(`/api/v1/admin/networks/${id}`, { token })
  return data?.network || data
}

/**
 * Create a new network (Admin only)
 */
export async function createNetwork(token: string | null, networkData: {
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
  return apiFetch('/api/v1/admin/networks', {
    method: 'POST',
    token,
    body: networkData,
  })
}

/**
 * Update an existing network (Admin only)
 */
export async function updateNetwork(token: string | null, id: number, networkData: {
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
  return apiFetch(`/api/v1/admin/networks/${id}`, {
    method: 'PUT',
    token,
    body: networkData,
  })
}

/**
 * Delete a network (Admin only)
 */
export async function deleteNetwork(token: string | null, id: number) {
  return apiFetch(`/api/v1/admin/networks/${id}`, {
    method: 'DELETE',
    token,
  })
}

/**
 * Get all coin-networks (Admin only)
 */
export async function getCoinNetworks(token: string | null, page = 1, limit = 10, search = '', coin?: string, network?: string) {
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

  const data = await apiFetch<any>(`/api/v1/admin/coin-networks?${params}`, { token })

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
 */
export async function createCoin(token: string | null, coinData: {
  name: string
  symbol: string
  decimals: number
  type?: string
  isStableCoin: boolean
  logoUrl?: string
  status: string
}) {
  return apiFetch('/api/v1/admin/coins', {
    method: 'POST',
    token,
    body: {
      ...coinData,
      type: coinData.type || 'native',
    },
  })
}

/**
 * Update an existing coin (Admin only)
 */
export async function updateCoin(token: string | null, id: number, coinData: {
  name?: string
  symbol?: string
  decimals?: number
  type?: string
  isStableCoin?: boolean
  logoUrl?: string
  status?: string
}) {
  return apiFetch(`/api/v1/admin/coins/${id}`, {
    method: 'PUT',
    token,
    body: coinData,
  })
}

/**
 * Delete a coin (Admin only)
 */
export async function deleteCoin(token: string | null, id: number) {
  return apiFetch(`/api/v1/admin/coins/${id}`, {
    method: 'DELETE',
    token,
  })
}

/**
 * Get coin-network by ID (Admin only)
 */
export async function getCoinNetworkById(token: string | null, id: number) {
  const data = await apiFetch<any>(`/api/v1/admin/coin-networks/${id}`, { token })
  return data?.coinNetwork || data
}

/**
 * Create a new coin-network (Admin only)
 */
export async function createCoinNetwork(token: string | null, coinNetworkData: {
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
  dailyWithdrawLimitUsd?: string
}) {
  return apiFetch('/api/v1/admin/coin-networks', {
    method: 'POST',
    token,
    body: coinNetworkData,
  })
}

/**
 * Update an existing coin-network (Admin only)
 */
export async function updateCoinNetwork(token: string | null, id: number, coinNetworkData: {
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
  dailyWithdrawLimitUsd?: string
}) {
  return apiFetch(`/api/v1/admin/coin-networks/${id}`, {
    method: 'PUT',
    token,
    body: coinNetworkData,
  })
}

/**
 * Delete a coin-network (Admin only)
 */
export async function deleteCoinNetwork(token: string | null, id: number) {
  return apiFetch(`/api/v1/admin/coin-networks/${id}`, {
    method: 'DELETE',
    token,
  })
}

/**
 * Get sweep settings (Admin only)
 */
export async function getSweepSettings(
  token: string | null,
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

  return apiFetch(`/api/v1/admin/settings?${params}`, { token })
}

/**
 * Update sweep setting (Admin only)
 */
export async function updateSweepSetting(
  token: string | null,
  keyName: string,
  value: any
) {
  return apiFetch(`/api/v1/admin/settings/${keyName}`, {
    method: 'PUT',
    token,
    body: { value },
  })
}

/**
 * Get payment statistics (Admin only)
 */
export async function getPaymentStats(token: string | null) {
  return apiFetch('/api/v1/admin/payments/stats', { token })
}

/**
 * Get system wallet details (Admin only)
 */
export async function getSystemWallet(
  token: string | null,
  systemWalletId: number
) {
  const data = await apiFetch<any>(`/api/v1/admin/system-wallets/${systemWalletId}`, { token })

  const wallet = data?.wallet || {}
  const assets = data?.assets || []
  const signers = data?.signers || []

  const firstAsset = assets[0]

  return {
    ...wallet,
    assets,
    signers,
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
 */
export async function getSystemWalletLedger(
  token: string | null,
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

  const data = await apiFetch<any>(url, { token })

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
 */
export async function getLedgerEntries(
  token: string | null,
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

  const data = await apiFetch<any>(url, { token })

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
 */
export async function getSweeps(
  token: string | null,
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

  const data = await apiFetch<any>(url, { token })

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
 */
export async function getSweepById(token: string | null, sweepId: number) {
  const data = await apiFetch<any>(`/api/v1/admin/sweeps/${sweepId}`, { token })
  return data?.sweep || data
}

/**
 * Retry a failed sweep transaction (Admin only)
 */
export async function forceSweep(token: string | null, sweepId: number) {
  return apiFetch(`/api/v1/admin/sweeps/${sweepId}/retry`, {
    method: 'POST',
    token,
  })
}

/**
 * Get all withdrawal transactions (Admin only)
 */
export async function getWithdrawals(
  token: string | null,
  params: {
    page?: number
    limit?: number
    status?: string
    userId?: string
    coinNetworkId?: number
    search?: string
    startDate?: string
    endDate?: string
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.status) queryParams.append('status', params.status)
  if (params.userId) queryParams.append('userId', params.userId)
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  if (params.search) queryParams.append('search', params.search)
  if (params.startDate) queryParams.append('startDate', params.startDate)
  if (params.endDate) queryParams.append('endDate', params.endDate)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/withdrawals${queryString ? `?${queryString}` : ''}`

  const data = await apiFetch<any>(url, { token })

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
 */
export async function approveWithdrawal(
  token: string | null,
  withdrawalId: number,
  reason?: string
) {
  return apiFetch(`/api/v1/admin/withdrawals/${withdrawalId}/approve`, {
    method: 'PATCH',
    token,
    body: reason ? { reason } : undefined
  })
}

/**
 * Reject a withdrawal transaction
 */
export async function rejectWithdrawal(
  token: string | null,
  withdrawalId: number,
  reason: string
) {
  return apiFetch(`/api/v1/admin/withdrawals/${withdrawalId}/reject`, {
    method: 'PATCH',
    token,
    body: { reason }
  })
}

/**
 * Get revenue summary (Admin only)
 */
export async function getRevenueSummary(token: string | null, from: string, to: string) {
  const queryParams = new URLSearchParams({ from, to })
  return apiFetch(`/api/v1/admin/revenue/summary?${queryParams.toString()}`, { token })
}

/**
 * Get daily revenue data (Admin only)
 */
export async function getRevenueDaily(token: string | null, from: string, to: string, coinNetworkId?: number) {
  const queryParams = new URLSearchParams({ from, to })
  if (coinNetworkId) {
    queryParams.append('coinNetworkId', String(coinNetworkId))
  }
  return apiFetch(`/api/v1/admin/revenue/daily?${queryParams.toString()}`, { token })
}

/**
 * Get system ledger entries (Admin only)
 */
export async function getSystemLedgerEntries(
  token: string | null,
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

  const data = await apiFetch<any>(url, { token })

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
 */
export async function getSystemLedgerEntry(token: string | null, id: number) {
  return apiFetch(`/api/v1/admin/system-ledger/${id}`, { token })
}

/**
 * Get user ledger entries (Admin only)
 */
export async function getUserLedgerEntries(
  token: string | null,
  params: {
    page?: number
    limit?: number
    type?: string
    userId?: number
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
  if (params.userId) queryParams.append('userId', String(params.userId))
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  if (params.entryCode) queryParams.append('entryCode', params.entryCode)
  if (params.state) queryParams.append('state', params.state)
  if (params.txHash) queryParams.append('txHash', params.txHash)
  if (params.startDate) queryParams.append('startDate', params.startDate)
  if (params.endDate) queryParams.append('endDate', params.endDate)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/user-ledger${queryString ? `?${queryString}` : ''}`

  const data = await apiFetch<any>(url, { token })

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
 */
export async function getUserLedgerEntry(token: string | null, id: number) {
  return apiFetch(`/api/v1/admin/user-ledger/${id}`, { token })
}

/**
 * Get revenue by coin (Admin only)
 */
export async function getRevenueByCoin(token: string | null, from: string, to: string) {
  const queryParams = new URLSearchParams({ from, to })
  return apiFetch(`/api/v1/admin/revenue/by-coin?${queryParams.toString()}`, { token })
}

/**
 * Get admin invoices (Admin only)
 */
export async function getAdminInvoices(
  token: string | null,
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

  const data = await apiFetch<any>(url, { token })

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
 */
export async function getAdminInvoice(token: string | null, id: number | string) {
  const data = await apiFetch<any>(`/api/v1/admin/invoices/${id}`, { token })
  return data?.invoice || data
}

/**
 * Get admin payments (Admin only)
 */
export async function getAdminPayments(
  token: string | null,
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

  const data = await apiFetch<any>(url, { token })

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
 */
export async function getAdminPayment(token: string | null, id: number | string) {
  const data = await apiFetch<any>(`/api/v1/admin/payments/${id}`, { token })
  return data?.payment || data
}

/**
 * Get platform ledger entries (Admin only)
 */
export async function getPlatformLedgerEntries(
  token: string | null,
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

  const data = await apiFetch<any>(url, { token })

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
 */
export async function getPlatformLedgerEntry(token: string | null, id: number) {
  return apiFetch(`/api/v1/admin/platform-ledger/entries/${id}`, { token })
}

// ── Gas Topups ────────────────────────────────────────────────────

/**
 * Get all gas topups (Admin only)
 */
export async function getGasTopups(
  token: string | null,
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

  const data = await apiFetch<any>(url, { token })

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
export async function getGasTopupById(token: string | null, id: number) {
  const data = await apiFetch<any>(`/api/v1/admin/wallet-gas-topups/${id}`, { token })
  return data?.gasTopup || data
}

// ── Withdrawal Addresses ──────────────────────────────────────────

/**
 * Get all withdrawal addresses (Admin only)
 */
export async function getWithdrawalAddresses(
  token: string | null,
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

  const data = await apiFetch<any>(url, { token })

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
export async function getWithdrawalAddressById(token: string | null, id: number) {
  return apiFetch(`/api/v1/admin/withdrawal-addresses/${id}`, { token })
}

/**
 * Flag a withdrawal address (Admin only)
 */
export async function flagWithdrawalAddress(token: string | null, id: number, reason: string) {
  return apiFetch(`/api/v1/admin/withdrawal-addresses/${id}/flag`, {
    method: 'PATCH',
    token,
    body: { reason }
  })
}

/**
 * Unflag a withdrawal address (Admin only)
 */
export async function unflagWithdrawalAddress(token: string | null, id: number, reason: string) {
  return apiFetch(`/api/v1/admin/withdrawal-addresses/${id}/unflag`, {
    method: 'PATCH',
    token,
    body: { reason }
  })
}

/**
 * Force verify a withdrawal address (Admin only)
 */
export async function forceVerifyWithdrawalAddress(token: string | null, id: number, reason: string, skipLockPeriod?: boolean) {
  return apiFetch(`/api/v1/admin/withdrawal-addresses/${id}/force-verify`, {
    method: 'PATCH',
    token,
    body: { reason, skipLockPeriod: skipLockPeriod || false }
  })
}

/**
 * Permanently delete a withdrawal address (Admin only)
 */
export async function deleteWithdrawalAddress(token: string | null, id: number, reason: string) {
  return apiFetch(`/api/v1/admin/withdrawal-addresses/${id}/permanent`, {
    method: 'DELETE',
    token,
    body: { reason, confirmed: true }
  })
}

export async function approveWithdrawalAddress(token: string | null, id: number) {
  return apiFetch(`/api/v1/admin/withdrawal-addresses/${id}/approve`, {
    method: 'PATCH',
    token,
  })
}

export async function suspendWithdrawalAddress(token: string | null, id: number, reason: string) {
  return apiFetch(`/api/v1/admin/withdrawal-addresses/${id}/suspend`, {
    method: 'PATCH',
    token,
    body: { reason }
  })
}

export async function getIncomeStatement(
  token: string | null,
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

  return apiFetch(url, { token })
}

// ── Merchants ──────────────────────────────────────────

/**
 * List merchants with filters (Admin only)
 */
export async function getMerchants(
  token: string | null,
  params: {
    page?: number
    limit?: number
    status?: string
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.status) queryParams.append('status', params.status)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/merchants${queryString ? `?${queryString}` : ''}`

  const data = await apiFetch<any>(url, { token })

  const items = data?.items || data?.merchants || []
  const meta = data?.meta || {}

  return {
    items,
    pagination: {
      page: meta.currentPage || meta.page || 1,
      limit: meta.perPage || meta.limit || 20,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Activate a merchant (Admin only)
 */
export async function activateMerchant(token: string | null, id: number) {
  return apiFetch(`/api/v1/admin/merchants/${id}/activate`, {
    method: 'POST',
    token,
  })
}

/**
 * Suspend a merchant (Admin only)
 */
export async function suspendMerchant(token: string | null, id: number) {
  return apiFetch(`/api/v1/admin/merchants/${id}/suspend`, {
    method: 'POST',
    token,
  })
}

// ── User Management ──────────────────────────────────────────

/**
 * List users with filters (Admin only)
 */
export async function getUsers(
  token: string | null,
  params: {
    page?: number
    limit?: number
    status?: string
    role?: string
    email?: string
    search?: string
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
  if (params.role) queryParams.append('role', params.role)
  if (params.email) queryParams.append('email', params.email)
  if (params.search) queryParams.append('search', params.search)
  if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
  if (params.dateTo) queryParams.append('dateTo', params.dateTo)
  if (params.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/users${queryString ? `?${queryString}` : ''}`

  const data = await apiFetch<any>(url, { token })

  const items = data?.items || data?.users || []
  const meta = data?.meta || {}

  return {
    items,
    pagination: {
      page: meta.currentPage || meta.page || 1,
      limit: meta.perPage || meta.limit || 20,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Get user detail by ID (Admin only)
 */
export async function getUserById(token: string | null, id: number) {
  const data = await apiFetch<any>(`/api/v1/admin/users/${id}`, { token })
  return data?.user || data
}

/**
 * Change user status (Admin only)
 */
export async function changeUserStatus(token: string | null, id: number, status: string, reason?: string) {
  const body: any = { status }
  if (reason) body.reason = reason

  return apiFetch(`/api/v1/admin/users/${id}/status`, {
    method: 'PATCH',
    token,
    body,
  })
}

/**
 * Change user role (Admin only)
 */
export async function changeUserRole(token: string | null, id: number, role: string) {
  return apiFetch(`/api/v1/admin/users/${id}/role`, {
    method: 'PATCH',
    token,
    body: { role },
  })
}

/**
 * Admin reset user password (Admin only)
 */
export async function resetUserPassword(token: string | null, id: number, newPassword: string) {
  return apiFetch(`/api/v1/admin/users/${id}/reset-password`, {
    method: 'POST',
    token,
    body: { newPassword },
  })
}

/**
 * Disable user 2FA (Admin only)
 */
export async function disableUser2FA(token: string | null, id: number) {
  return apiFetch(`/api/v1/admin/users/${id}/disable-2fa`, {
    method: 'POST',
    token,
  })
}

/**
 * Create a new user (Admin only)
 */
export async function createUser(
  token: string | null,
  data: { email: string; password: string; fullName?: string; role: string }
) {
  return apiFetch(`/api/v1/admin/users`, {
    method: 'POST',
    token,
    body: data,
  })
}

// ── Admin Settings ──────────────────────────────────────────

/**
 * List settings with filters (Admin only)
 */
export async function getSettings(
  token: string | null,
  params: {
    page?: number
    limit?: number
    category?: string
    scope?: string
    entityId?: number
    search?: string
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.category) queryParams.append('category', params.category)
  if (params.scope) queryParams.append('scope', params.scope)
  if (params.entityId) queryParams.append('entityId', String(params.entityId))
  if (params.search) queryParams.append('search', params.search)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/settings${queryString ? `?${queryString}` : ''}`

  const data = await apiFetch<any>(url, { token })

  const items = data?.items || data?.settings || []
  const meta = data?.meta || data?.pagination || {}

  return {
    items,
    pagination: {
      page: meta.currentPage || meta.page || 1,
      limit: meta.perPage || meta.limit || 50,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Get setting categories with counts (Admin only)
 */
export async function getSettingCategories(token: string | null) {
  return apiFetch('/api/v1/admin/settings/categories', { token })
}

/**
 * Get setting by ID (Admin only)
 */
export async function getSettingById(token: string | null, id: number) {
  const data = await apiFetch<any>(`/api/v1/admin/settings/${id}`, { token })
  return data?.setting || data
}

/**
 * Get setting by key name (Admin only)
 */
export async function getSettingByKey(token: string | null, key: string) {
  const data = await apiFetch<any>(`/api/v1/admin/settings/key/${encodeURIComponent(key)}`, { token })
  return data?.setting || data
}

/**
 * Upsert (update) a setting (Admin only)
 */
export async function upsertSetting(
  token: string | null,
  payload: {
    keyName: string
    value: string
    defaultValue?: string | null
    dataType?: string
    category?: string
    scope?: string
    entityId?: number | null
    isEncrypted?: boolean
    isPublic?: boolean
    description?: string
  }
) {
  return apiFetch('/api/v1/admin/settings', {
    method: 'PUT',
    token,
    body: payload,
  })
}

// ============================================================
// Admin Roles & Role Permissions (RBAC)
// ============================================================

/**
 * Get all roles (Admin only)
 */
export async function getAdminRoles(token: string | null) {
  return apiFetch('/api/v1/admin/roles', { token })
}

/**
 * Get role stats (Admin only)
 */
export async function getAdminRoleStats(token: string | null) {
  return apiFetch('/api/v1/admin/roles/stats', { token })
}

/**
 * Get resolved permissions for a role (Admin only)
 */
export async function getRolePermissions(token: string | null, role: string) {
  return apiFetch(`/api/v1/admin/roles/${role}/permissions`, { token })
}

/**
 * Get permission overrides for a role (Admin only)
 */
export async function getRolePermissionOverrides(token: string | null, role: string) {
  return apiFetch(`/api/v1/admin/roles/${role}/permissions/overrides`, { token })
}

/**
 * Grant a permission to a role (Admin only)
 */
export async function grantRolePermission(token: string | null, role: string, permission: string, reason?: string) {
  const body: Record<string, string> = { permission }
  if (reason) body.reason = reason
  return apiFetch(`/api/v1/admin/roles/${role}/permissions/grant`, {
    method: 'POST',
    token,
    body,
  })
}

/**
 * Deny a permission for a role (Admin only)
 */
export async function denyRolePermission(token: string | null, role: string, permission: string, reason?: string) {
  const body: Record<string, string> = { permission }
  if (reason) body.reason = reason
  return apiFetch(`/api/v1/admin/roles/${role}/permissions/deny`, {
    method: 'POST',
    token,
    body,
  })
}

/**
 * Delete a single permission override (Admin only)
 */
export async function deleteRolePermissionOverride(token: string | null, role: string, overrideId: number) {
  return apiFetch(`/api/v1/admin/roles/${role}/permissions/overrides/${overrideId}`, {
    method: 'DELETE',
    token,
  })
}

/**
 * Reset all permission overrides for a role (Admin only)
 */
export async function resetRolePermissionOverrides(token: string | null, role: string) {
  return apiFetch(`/api/v1/admin/roles/${role}/permissions/overrides`, {
    method: 'DELETE',
    token,
  })
}

// ─── Temp Wallets ───────────────────────────────────────────────────────────

/**
 * List temp wallets (Admin only, read-only)
 */
export async function getTempWallets(
  token: string | null,
  params: {
    page?: number
    limit?: number
    status?: string
    coinNetworkId?: number
    userId?: number
    address?: string
    sortBy?: string
    sortOrder?: string
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.status) queryParams.append('status', params.status)
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  if (params.userId) queryParams.append('userId', String(params.userId))
  if (params.address) queryParams.append('address', params.address)
  if (params.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/temp-wallets${queryString ? `?${queryString}` : ''}`

  const data = await apiFetch<any>(url, { token })

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
 * Get temp wallet by ID (Admin only, read-only)
 */
export async function getTempWallet(token: string | null, id: number | string) {
  const data = await apiFetch<any>(`/api/v1/admin/temp-wallets/${id}`, { token })
  return data?.tempWallet || data?.wallet || data
}

/**
 * List temp wallet usage histories (Admin only, read-only)
 */
export async function getTempWalletHistories(
  token: string | null,
  params: {
    page?: number
    limit?: number
    tempWalletId?: number
    invoiceId?: number
    userId?: number
    coinNetworkId?: number
    status?: string
    sortBy?: string
    sortOrder?: string
  } = {}
) {
  const queryParams = new URLSearchParams()

  if (params.page) queryParams.append('page', String(params.page))
  if (params.limit) queryParams.append('limit', String(params.limit))
  if (params.tempWalletId) queryParams.append('tempWalletId', String(params.tempWalletId))
  if (params.invoiceId) queryParams.append('invoiceId', String(params.invoiceId))
  if (params.userId) queryParams.append('userId', String(params.userId))
  if (params.coinNetworkId) queryParams.append('coinNetworkId', String(params.coinNetworkId))
  if (params.status) queryParams.append('status', params.status)
  if (params.sortBy) queryParams.append('sortBy', params.sortBy)
  if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder)

  const queryString = queryParams.toString()
  const url = `/api/v1/admin/temp-wallet-histories${queryString ? `?${queryString}` : ''}`

  const data = await apiFetch<any>(url, { token })

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
 * Get temp wallet history by ID (Admin only, read-only)
 */
export async function getTempWalletHistory(token: string | null, id: number | string) {
  const data = await apiFetch<any>(`/api/v1/admin/temp-wallet-histories/${id}`, { token })
  return data?.history || data?.tempWalletHistory || data
}

// ─── User Balances ───────────────────────────────────────────────

/**
 * Get user balances summary (Admin only)
 */
export async function getUserBalancesSummary(token: string | null) {
  return apiFetch('/api/v1/admin/user-balances/summary', { token })
}

/**
 * List user balances (Admin only, paginated)
 */
export async function getUserBalances(
  token: string | null,
  params: {
    page?: number
    limit?: number
    sortBy?: string
    sortOrder?: string
    minValueUsd?: number
  } = {}
) {
  const query = new URLSearchParams()
  if (params.page) query.set('page', String(params.page))
  if (params.limit) query.set('limit', String(params.limit))
  if (params.sortBy) query.set('sortBy', params.sortBy)
  if (params.sortOrder) query.set('sortOrder', params.sortOrder)
  if (params.minValueUsd != null) query.set('minValueUsd', String(params.minValueUsd))

  const qs = query.toString()
  const raw = await apiFetch<any>(`/api/v1/admin/user-balances${qs ? `?${qs}` : ''}`, { token })

  const items = Array.isArray(raw) ? raw : (Array.isArray(raw?.items) ? raw.items : [])
  const meta = raw?.meta || {}

  return {
    items,
    pagination: {
      page: meta.page || 1,
      limit: meta.limit || meta.perPage || 20,
      total: meta.total || 0,
      totalPages: meta.lastPage || meta.totalPages || 1,
      hasNext: meta.hasNextPage ?? ((meta.page || 1) < (meta.lastPage || 1)),
      hasPrev: meta.hasPrevPage ?? ((meta.page || 1) > 1),
    }
  }
}

/**
 * Get user balance detail by userId (Admin only, real-time)
 */
export async function getUserBalanceDetail(token: string | null, userId: number | string) {
  return apiFetch(`/api/v1/admin/user-balances/${userId}`, { token })
}
