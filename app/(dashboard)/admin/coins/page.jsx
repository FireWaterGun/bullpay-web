'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useAuth } from '@/app/providers'
import { getCoins } from '@/lib/api/admin'
import CoinImg from '@/components/CoinImg'

export default function CoinList() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const [coins, setCoins] = useState([])
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
    loadCoins()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function handleApplyFilter() {
    setSearchQuery(draftSearch)
    loadCoins(1, pagination.limit, draftSearch)
  }

  function handleResetFilter() {
    setDraftSearch('')
    setSearchQuery('')
    loadCoins(1, pagination.limit, '')
  }

  async function loadCoins(page = pagination.page, limit = pagination.limit, search = searchQuery) {
    setLoading(true)
    setError('')
    try {
      const response = await getCoins(token, page, limit, search)
      const coinList = response?.items || []
      const paginationData = response?.pagination || {}
      
      setCoins(coinList)
      setPagination({
        page: paginationData.page || page,
        limit: paginationData.limit || limit,
        total: paginationData.total || 0,
        totalPages: paginationData.totalPages || 0,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false
      })
      
    } catch (e) {
      setError(e?.message || 'Failed to load coins')
    } finally {
      setLoading(false)
    }
  }

  function handlePageChange(newPage) {
    loadCoins(newPage, pagination.limit)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card">
        <div className="card-header">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
            <div>
              <h4 className="mb-1">
                <i className="bx bx-coin me-2"></i>
                {t('nav.coins', { defaultValue: 'Coins' })}
              </h4>
              <p className="text-muted mb-0">{t('crypto.manageCoinsList', { defaultValue: 'Manage cryptocurrency coins' })}</p>
            </div>
          </div>
          
          {/* Filters */}
          <div className="row g-3 align-items-end">
            <div className="col-md-3 col-sm-6">
              <label className="form-label">{t('filter.search', { defaultValue: 'Search' })}</label>
              <input
                type="text"
                className="form-control"
                placeholder={t('crypto.searchCoins', { defaultValue: 'Search by name or symbol...' })}
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
                <th>{t('crypto.symbol', { defaultValue: 'Symbol' })}</th>
                <th className="text-center">{t('crypto.type', { defaultValue: 'Type' })}</th>
                <th className="text-center">{t('crypto.decimals', { defaultValue: 'Decimals' })}</th>
                <th className="text-center">{t('invoices.statusCol')}</th>
                <th className="text-center">{t('invoices.actions')}</th>
              </tr>
            </thead>
            <tbody style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              {coins.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-6">
                    <div className="d-flex flex-column align-items-center justify-content-center">
                      <i className="bx bx-coin mb-3" style={{ fontSize: '3rem', color: '#a1acb8' }}></i>
                      <p className="text-muted mb-0">
                        {searchQuery 
                          ? t('crypto.noSearchResults', { defaultValue: 'No coins found matching your search' })
                          : t('crypto.noCoins', { defaultValue: 'No coins found' })
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                coins.map((coin) => (
                  <tr key={coin.id}>
                    <td style={{ verticalAlign: 'middle' }}>
                      <div className="d-flex align-items-center">
                        <CoinImg
                          symbol={coin.symbol}
                          logoUrl={coin.logoUrl}
                          size={40}
                          className="me-3"
                          showFallback
                        />
                        <div>
                          <div className="fw-medium">{coin.name || 'N/A'}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className="fw-medium">{coin.symbol}</span>
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      {coin.type === 'native' 
                        ? t('crypto.native', { defaultValue: 'Native' })
                        : t('crypto.token', { defaultValue: 'Token' })
                      }
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>{coin.decimals || 0}</td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      {coin.status === 'active' ? (
                        <span className="badge bg-label-success">{t('admin.active')}</span>
                      ) : (
                        <span className="badge bg-label-secondary">{coin.status}</span>
                      )}
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      <Link
                        href={`/admin/coins/${coin.id}`}
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
        {!error && coins.length > 0 && (
          <div className="card-footer d-flex justify-content-between align-items-center">
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
        )}
      </div>
    </div>
  )
}
