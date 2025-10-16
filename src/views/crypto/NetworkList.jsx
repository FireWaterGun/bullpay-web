import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { getNetworks } from '../../api/admin.ts'

export default function NetworkList() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const navigate = useNavigate()
  const [networks, setNetworks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  useEffect(() => {
    loadNetworks()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Debounce search - reset to page 1 when searching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== undefined) {
        loadNetworks(1, searchQuery)
      }
    }, 500)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery])

  async function loadNetworks(page = pagination.page, search = searchQuery) {
    setLoading(true)
    setError('')
    try {
      // Use server-side pagination
      const response = await getNetworks(token, page, 10)
      const networkList = response?.items || []
      const paginationData = response?.pagination || {}
      
      // Client-side search filtering if search query exists
      let filtered = networkList
      if (search) {
        filtered = networkList.filter(network => 
          network.name?.toLowerCase().includes(search.toLowerCase()) ||
          network.chainId?.toString().includes(search)
        )
      }

      setNetworks(filtered)
      setPagination({
        page: paginationData.page || page,
        limit: paginationData.limit || 10,
        total: paginationData.total || filtered.length,
        totalPages: paginationData.totalPages || 1,
        hasNext: paginationData.hasNext || false,
        hasPrev: paginationData.hasPrev || false
      })
    } catch (e) {
      setError(e?.message || 'Failed to load networks')
    } finally {
      setLoading(false)
    }
  }

  function handlePageChange(newPage) {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      loadNetworks(newPage)
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  function handleSearchChange(e) {
    setSearchQuery(e.target.value)
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="card">
        <div className="card-header">
          {/* Header */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="mb-0">{t('crypto.networksList', { defaultValue: 'Networks' })}</h5>
              <p className="text-muted small mb-0 mt-1">{t('crypto.manageNetworksList', { defaultValue: 'Manage blockchain networks' })}</p>
            </div>
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={() => navigate('/admin/crypto/networks/create')}
            >
              <i className="bx bx-plus me-1"></i>
              {t('actions.create', { defaultValue: 'Create' })}
            </button>
          </div>

          {/* Search Bar */}
          <div className="row">
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text">
                  <i className="bx bx-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder={t('crypto.searchNetworks', { defaultValue: 'Search by name or chain ID...' })}
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
                {searchQuery && (
                  <button
                    className="btn btn-outline-secondary"
                    type="button"
                    onClick={() => setSearchQuery('')}
                  >
                    <i className="bx bx-x"></i>
                  </button>
                )}
              </div>
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
                <th>{t('crypto.networkName', { defaultValue: 'Network' })}</th>
                <th className="text-center">{t('crypto.chainId', { defaultValue: 'Chain ID' })}</th>
                <th>{t('crypto.explorerUrl', { defaultValue: 'Explorer' })}</th>
                <th className="text-center">{t('invoices.statusCol', { defaultValue: 'Status' })}</th>
                <th className="text-center">{t('actions.actions', { defaultValue: 'Actions' })}</th>
              </tr>
            </thead>
            <tbody style={{ opacity: loading ? 0.6 : 1, transition: 'opacity 0.2s' }}>
              {networks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-6">
                    <div className="d-flex flex-column align-items-center justify-content-center">
                      <i className="bx bx-network-chart mb-3" style={{ fontSize: '3rem', color: '#a1acb8' }}></i>
                      <p className="text-muted mb-0">
                        {searchQuery 
                          ? t('crypto.noNetworksFound', { defaultValue: 'No networks found' })
                          : t('crypto.noNetworks', { defaultValue: 'No networks yet' })
                        }
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                networks.map((network) => (
                  <tr key={network.id}>
                    <td style={{ verticalAlign: 'middle' }}>
                      <span className="fw-medium">{network.name || 'N/A'}</span>
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      {network.chainId || 'N/A'}
                    </td>
                    <td style={{ verticalAlign: 'middle' }}>
                      {network.explorerUrl ? (
                        <a 
                          href={network.explorerUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-decoration-none"
                        >
                          <i className="bx bx-link-external me-1"></i>
                          {new URL(network.explorerUrl).hostname}
                        </a>
                      ) : (
                        <span className="text-muted">N/A</span>
                      )}
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      <span className={`badge bg-label-${
                        network.status === 'active' ? 'success' : 
                        network.status === 'maintenance' ? 'warning' : 
                        'secondary'
                      }`}>
                        {network.status === 'active' 
                          ? t('admin.active', { defaultValue: 'Active' })
                          : network.status === 'maintenance'
                          ? t('crypto.maintenance', { defaultValue: 'Maintenance' })
                          : t('crypto.inactive', { defaultValue: 'Inactive' })
                        }
                      </span>
                    </td>
                    <td className="text-center" style={{ verticalAlign: 'middle' }}>
                      <button
                        className="btn btn-sm btn-icon btn-label-primary"
                        onClick={() => navigate(`/admin/crypto/networks/${network.id}`)}
                        title={t('actions.edit', { defaultValue: 'Edit' })}
                      >
                        <i className="bx bx-edit"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Search results info */}
        {!loading && searchQuery && networks.length > 0 && (
          <div className="card-footer">
            <div className="text-muted small">
              {t('crypto.searchResults', { 
                count: networks.length,
                defaultValue: `Found ${networks.length} result(s) in current page`
              })}
            </div>
          </div>
        )}

        {/* Pagination - hide when searching */}
        {!loading && networks.length > 0 && !searchQuery && (
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
