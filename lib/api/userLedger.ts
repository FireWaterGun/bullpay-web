import { apiFetch } from '@/lib/api-client'

export async function getMyLedgerEntries(
  token: string | null,
  params: {
    page?: number
    limit?: number
    coinNetworkId?: number
    entryType?: string
    entryCode?: string
    state?: string
    txHash?: string
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
  if (params.txHash) qp.append('txHash', params.txHash)
  if (params.startDate) qp.append('startDate', params.startDate)
  if (params.endDate) qp.append('endDate', params.endDate)

  const qs = qp.toString()
  const url = `/api/v1/user/ledger${qs ? `?${qs}` : ''}`

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
      hasNext: meta.hasNextPage ?? (meta.page || 1) < (meta.lastPage || 1),
      hasPrev: meta.hasPrevPage ?? (meta.page || 1) > 1,
    },
  }
}

export async function getMyLedgerEntry(token: string | null, id: string | number) {
  return apiFetch(`/api/v1/user/ledger/${id}`, { token })
}
