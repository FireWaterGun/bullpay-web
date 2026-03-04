'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import Link from 'next/link'
import { useAuth } from '@/app/providers'
import { useToast } from '@/app/providers'
import { getCoinNetworks } from '@/lib/api/admin'
import CoinImg from '@/components/CoinImg'
import { copyToClipboard as copyText } from '@/lib/utils/clipboard'
import TableEmptyState from '@/components/TableEmptyState'

export default function SupportedCrypto() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const [coinNetworks, setCoinNetworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [draftSearch, setDraftSearch] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  useEffect(() => {
    loadCoinNetworks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleApplyFilter() {
    setSearchQuery(draftSearch)
    loadCoinNetworks(1, pagination.limit, draftSearch)
  }

  function handleResetFilter() {
    setDraftSearch('')
    setSearchQuery('')
    loadCoinNetworks(1, pagination.limit, '')
  }

  async function loadCoinNetworks(page = pagination.page, limit = pagination.limit, search = searchQuery) {
    setLoading(true)
    setError('')
    try {
      const response = await getCoinNetworks(token, page, limit, search, '', '')
      const items = response?.items || []
      const paginationData = response?.pagination || {}

      setCoinNetworks(items)
      setPagination({
        page: paginationData.page || page,
        limit: paginationData.limit || limit,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || 0,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false
      })
    } catch (e) {
      setError(e?.message || 'Failed to load supported crypto')
    } finally {
      setLoading(false)
    }
  }

  function handlePageChange(newPage) {
    loadCoinNetworks(newPage, pagination.limit)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <div>
              <h4 className="mb-1">
                <i className="bx bx-link me-2"></i>
                {t('nav.coinNetworks', { defaultValue: 'Coin Networks' })}
              </h4>
              <p className="text-muted mb-0">{t('crypto.manageCoinNetworks', { defaultValue: 'Manage coin-network pairs' })}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="row g-3 align-items-end">
            <div className="col-md-3 col-sm-6">
              <label className="form-label">{t('filter.search', { defaultValue: 'Search' })}</label>
              <input
                type="text"
                className="form-control"
                placeholder={t('crypto.searchSupported', { defaultValue: 'Search by coin or network...' })}
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
            </div>
            <div className="col-auto d-flex gap-2">
              <button className="btn btn-primary" onClick={handleApplyFilter} disabled={loading}>
                <i className="bx bx-filter-alt me-1"></i>
                {t('filter.apply', { defaultValue: 'Apply Filters' })}
              </button>
              <button className="btn btn-outline-secondary" onClick={handleResetFilter} disabled={loading}>
                <i className="bx bx-reset me-1"></i>
                {t('filter.reset', { defaultValue: 'Reset' })}
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="card-body">
            <div className="alert alert-danger mb-0" role="alert">
              <i className="bx bx-error-circle me-2"></i>
              {error}
            </div>
          </div>
        )}

        {/* Table */}
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>{t('crypto.coinName', { defaultValue: 'Coin' })}</th>
                <th>{t('crypto.networkName', { defaultValue: 'Network' })}</th>
                <th className="text-center">{t('crypto.contractAddress', { defaultValue: 'Contract Address' })}</th>
                <th className="text-center">{t('invoices.statusCol', { defaultValue: 'Status' })}</th>
                <th className="text-center">{t('actions.actions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              {coinNetworks.length === 0 ? (
                <TableEmptyState
                  colSpan={5}
                  icon="bx-coin-stack"
                  message={searchQuery
                    ? t('crypto.noSupportedFound', { defaultValue: 'No supported crypto found' })
                    : t('crypto.noSupported', { defaultValue: 'No supported crypto yet' })
                  }
                />
              ) : (
                coinNetworks.map((coinNetwork) => (
                  <tr key={coinNetwork.id}>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div className="d-flex align-items-center">
                        <CoinImg
                          coin={coinNetwork.coin}
                          symbol={coinNetwork.coin?.symbol}
                          networkSymbol={coinNetwork.network?.symbol}
                          size={40}
                          className="me-3"
                          showFallback
                        />
                        <div>
                          <div className="fw-medium">{coinNetwork.coin?.name || 'N/A'}</div>
                          <small className="text-muted">{coinNetwork.coin?.symbol || 'N/A'}</small>
                        </div>
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div>
                        <div className="fw-medium">{coinNetwork.network?.name || 'N/A'}</div>
                        {coinNetwork.network?.chainId && (
                          <small className="text-muted">Chain ID: {coinNetwork.network.chainId}</small>
                        )}
                      </div>
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      {coinNetwork.contractAddress ? (
                        <div className="d-inline-flex align-items-center gap-2">
                          <code className="text-dark small" style={{ fontSize: '0.75rem' }}>
                            {coinNetwork.contractAddress}
                          </code>
                          <button
                            className="btn btn-sm btn-icon btn-outline-secondary"
                            onClick={async () => {
                              const ok = await copyText(coinNetwork.contractAddress)
                              if (ok) toast.success(t('actions.copied', { defaultValue: 'Copied' }))
                            }}
                            title={t('actions.copy', { defaultValue: 'Copy' })}
                          >
                            <i className="bx bx-copy"></i>
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted">{t('admin.detail.native', { defaultValue: 'Native' })}</span>
                      )}
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      <span className={`badge bg-label-${
                        coinNetwork.status === 'active' ? 'success' : 
                        coinNetwork.status === 'maintenance' ? 'warning' : 
                        'secondary'
                      }`}>
                        {coinNetwork.status === 'active' 
                          ? t('admin.active', { defaultValue: 'Active' })
                          : coinNetwork.status === 'maintenance'
                          ? t('crypto.maintenance', { defaultValue: 'Maintenance' })
                          : t('crypto.inactive', { defaultValue: 'Inactive' })
                        }
                      </span>
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      <Link
                        href={`/admin/coin-networks/${coinNetwork.id}`}
                        className="btn btn-sm btn-icon"
                        title={t('actions.edit', { defaultValue: 'Edit' })}
                      >
                        <i className="bx bx-edit text-primary" style={{ fontSize: '1.25rem' }}></i>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="card-footer">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-muted small">
                {t('invoices.showingEntries', {
                  start: pagination.total > 0 ? ((pagination.page - 1) * pagination.limit) + 1 : 0,
                  end: Math.min(pagination.page * pagination.limit, pagination.total),
                  total: pagination.total,
                  defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries'
                })}
              </div>
              <div className="btn-group">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={!pagination.hasPrev || loading}
                  onClick={() => handlePageChange(pagination.page - 1)}
                >
                  <i className="bx bx-chevron-left"></i>
                  {t('actions.prev', { defaultValue: 'Previous' })}
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled
                >
                  {pagination.page} / {pagination.totalPages}
                </button>
                <button
                  className="btn btn-outline-secondary btn-sm"
                  disabled={!pagination.hasNext || loading}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  {t('actions.next', { defaultValue: 'Next' })}
                  <i className="bx bx-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
