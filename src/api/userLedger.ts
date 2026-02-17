import { apiFetch } from './client'

/**
 * List my ledger entries (user-facing)
 * GET /api/v1/user/ledger
 */
export async function getMyLedgerEntries(
  token: string,
  params: {
    page?: number
    limit?: number
    coinNetworkId?: number
    entryType?: string
    entryCode?: string
    state?: string
    startDate?: string
    endDate?: string
  } = {}
) {
  const qp = new URLSearchParams()

  if (params.page) qp.append('page', String(params.page))
  if (params.limit) qp.append('limit', String(params.limit))
  if (params.coinNetworkId) qp.append('coinNetworkId', String(params.coinNetworkId))
  if (params.entryType) qp.append('entryType', params.entryType)
  if (params.entryCode) qp.append('entryCode', params.entryCode)
  if (params.state) qp.append('state', params.state)
  if (params.startDate) qp.append('startDate', params.startDate)
  if (params.endDate) qp.append('endDate', params.endDate)

  const qs = qp.toString()
  const url = `/api/v1/user/ledger${qs ? `?${qs}` : ''}`

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
    },
  }
}

/**
 * Get my ledger entry detail (user-facing)
 * GET /api/v1/user/ledger/:id
 */
export async function getMyLedgerEntry(token: string, id: string | number) {
  const response = await apiFetch(`/api/v1/user/ledger/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return response?.data || response
}
