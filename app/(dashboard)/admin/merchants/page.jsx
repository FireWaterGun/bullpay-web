'use client'

import { useState, useEffect } from 'react'
import { useSearchParams as useNextSearchParams } from 'next/navigation'
import { useAuth, useToast } from '@/app/providers'
import { useTranslation } from 'react-i18next'
import { getMerchants, activateMerchant, suspendMerchant } from '@/lib/api/admin'
import { formatCommission, formatDate } from '@/lib/utils/format'
import { STATUS_OPTIONS, statusBadgeClass } from '@/components/admin/merchantListHelpers'
import MerchantConfirmModal from '@/components/admin/MerchantConfirmModal'
import { logger } from '@/lib/utils/logger'
import RefreshButton from '@/components/RefreshButton'

export default function AdminMerchantsPage() {
  const { t } = useTranslation()
  const { token } = useAuth()
  const toast = useToast()
  const searchParams = useNextSearchParams()

  const initStatus = searchParams.get('status') || ''
  const initPage = parseInt(searchParams.get('page')) || 1

  const [loading, setLoading] = useState(false)
  const [merchants, setMerchants] = useState([])
  const [pagination, setPagination] = useState(null)
  const [currentPage, setCurrentPage] = useState(initPage)

  const [statusFilter, setStatusFilter] = useState(initStatus)
  const [appliedStatus, setAppliedStatus] = useState(initStatus)

  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState('')
  const [selectedMerchant, setSelectedMerchant] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  useEffect(() => { loadMerchants() }, [currentPage, appliedStatus])

  function syncSearchParams(status, page) {
    const params = new URLSearchParams()
    if (status) params.set('status', status)
    if (page > 1) params.set('page', page)
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  function applyFilters() {
    setAppliedStatus(statusFilter)
    setCurrentPage(1)
    syncSearchParams(statusFilter, 1)
  }

  function resetFilters() {
    setStatusFilter('')
    setAppliedStatus('')
    setCurrentPage(1)
    syncSearchParams('', 1)
  }

  async function loadMerchants() {
    if (!token) return
    try {
      setLoading(true)
      const data = await getMerchants(token, { page: currentPage, limit: 20, status: appliedStatus || undefined })
      setMerchants(data.items || [])
      setPagination(data.pagination || null)
    } catch (error) {
      logger.error('Failed to load merchants:', error)
      toast.error(t('admin.merchants.loadError', { defaultValue: 'Failed to load merchants' }))
    } finally {
      setLoading(false)
    }
  }

  function openModal(action, merchant) { setModalAction(action); setSelectedMerchant(merchant); setShowModal(true) }
  function closeModal() { if (modalLoading) return; setShowModal(false); setSelectedMerchant(null); setModalAction('') }

  async function handleConfirm() {
    if (!selectedMerchant) return
    try {
      setModalLoading(true)
      if (modalAction === 'activate') {
        await activateMerchant(token, selectedMerchant.id)
        toast.success(t('admin.merchants.activateSuccess', { defaultValue: 'Merchant activated successfully' }))
      } else if (modalAction === 'suspend') {
        await suspendMerchant(token, selectedMerchant.id)
        toast.success(t('admin.merchants.suspendSuccess', { defaultValue: 'Merchant suspended successfully' }))
      }
      closeModal()
      loadMerchants()
    } catch (error) {
      logger.error(`Failed to ${modalAction} merchant:`, error)
      toast.error(error?.message || t('admin.merchants.actionError', { defaultValue: 'Action failed. Please try again.' }))
    } finally {
      setModalLoading(false)
    }
  }

  if (loading && merchants.length === 0) {
    return (
      <div className="container-xxl flex-grow-1 container-p-y">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div>
          <p className="mt-3 text-muted">{t('invoices.loading', { defaultValue: 'Loading...' })}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card mb-4">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                  <h4 className="mb-1"><i className="bx bx-store me-2"></i>{t('admin.merchants.title', { defaultValue: 'Merchants' })}</h4>
                  <p className="text-muted mb-0">{t('admin.merchants.description', { defaultValue: 'Manage merchant accounts and status' })}</p>
                </div>
                <RefreshButton onClick={loadMerchants} loading={loading} />
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-3 col-sm-6">
                  <label className="form-label">{t('filter.status', { defaultValue: 'Status' })}</label>
                  <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">{t('filter.allStatus', { defaultValue: 'All Status' })}</option>
                    {STATUS_OPTIONS.map(s => (<option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>))}
                  </select>
                </div>
              </div>
              <div className="d-flex gap-2 mt-3">
                <button className="btn btn-primary" onClick={applyFilters} disabled={loading}><i className="bx bx-filter-alt me-1"></i>{t('filter.apply', { defaultValue: 'Apply Filters' })}</button>
                <button className="btn btn-outline-secondary" onClick={resetFilters} disabled={loading}><i className="bx bx-reset me-1"></i>{t('filter.reset', { defaultValue: 'Reset' })}</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="table-responsive" style={{ overflowX: 'auto' }}>
                <table className="table table-hover">
                  <thead>
                    <tr style={{ whiteSpace: 'nowrap' }}>
                      <th>{t('table.id', { defaultValue: 'ID' })}</th>
                      <th>{t('admin.merchants.name', { defaultValue: 'Name' })}</th>
                      <th>{t('admin.merchants.email', { defaultValue: 'Email' })}</th>
                      <th className="text-center">{t('table.status', { defaultValue: 'Status' })}</th>
                      <th className="text-end">{t('admin.merchants.commission', { defaultValue: 'Commission' })}</th>
                      <th className="text-center">{t('admin.merchants.webhook', { defaultValue: 'Webhook' })}</th>
                      <th>{t('table.created', { defaultValue: 'Created' })}</th>
                      <th className="text-center">{t('actions.actions', { defaultValue: 'Actions' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchants.length === 0 ? (
                      <tr><td colSpan="8" className="text-center text-muted py-4">{t('admin.merchants.noMerchants', { defaultValue: 'No merchants found' })}</td></tr>
                    ) : (
                      merchants.map((merchant) => {
                        const status = String(merchant.status || '').toLowerCase()
                        const canActivate = status === 'pending' || status === 'suspended'
                        const canSuspend = status === 'active' || status === 'pending'
                        return (
                          <tr key={merchant.id}>
                            <td><span className="fw-semibold text-primary">{merchant.id}</span></td>
                            <td>
                              <div>
                                <span className="fw-medium">{merchant.name || '-'}</span>
                                {merchant.description && <small className="d-block text-muted text-truncate" style={{ maxWidth: '250px' }} title={merchant.description}>{merchant.description}</small>}
                              </div>
                            </td>
                            <td>
                              <div>
                                <span>{merchant.email || '-'}</span>
                                {merchant.websiteUrl && <small className="d-block"><a href={merchant.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-muted">{merchant.websiteUrl}</a></small>}
                              </div>
                            </td>
                            <td className="text-center text-nowrap"><span className={statusBadgeClass(merchant.status)}>{String(merchant.status || '').toUpperCase()}</span></td>
                            <td className="text-end text-nowrap">{merchant.commissionRate ? formatCommission(merchant.commissionRate) : '-'}</td>
                            <td className="text-center">
                              {merchant.hasWebhook ? <span className="badge bg-label-success"><i className="bx bx-check"></i></span> : <span className="badge bg-label-secondary"><i className="bx bx-x"></i></span>}
                            </td>
                            <td className="text-nowrap" style={{ fontSize: '0.85rem' }}>{formatDate(merchant.createdAt)}</td>
                            <td className="text-center">
                              <div className="dropdown">
                                <button className="btn btn-sm btn-icon btn-text-secondary rounded-pill dropdown-toggle hide-arrow" data-bs-toggle="dropdown"><i className="bx bx-dots-vertical-rounded"></i></button>
                                <ul className="dropdown-menu dropdown-menu-end">
                                  {canActivate && <li><button className="dropdown-item" onClick={() => openModal('activate', merchant)}><i className="bx bx-check-circle me-2 text-primary"></i>{t('admin.merchants.activate', { defaultValue: 'Activate' })}</button></li>}
                                  {canSuspend && <li><button className="dropdown-item" onClick={() => openModal('suspend', merchant)}><i className="bx bx-block me-2 text-danger"></i>{t('admin.merchants.suspend', { defaultValue: 'Suspend' })}</button></li>}
                                  {!canActivate && !canSuspend && <li><span className="dropdown-item text-muted">{t('admin.merchants.noActions', { defaultValue: 'No actions available' })}</span></li>}
                                </ul>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {pagination && pagination.total > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-4">
                  <div className="text-muted small">
                    {t('invoices.showingEntries', { start: ((pagination.page - 1) * pagination.limit) + 1, end: Math.min(pagination.page * pagination.limit, pagination.total), total: pagination.total, defaultValue: 'Showing {{start}} to {{end}} of {{total}} entries' })}
                  </div>
                  <div className="btn-group">
                    <button className="btn btn-outline-secondary btn-sm" disabled={!pagination.hasPrev || loading} onClick={() => { setCurrentPage(currentPage - 1); syncSearchParams(appliedStatus, currentPage - 1) }}><i className="bx bx-chevron-left"></i> {t('actions.prev', { defaultValue: 'Previous' })}</button>
                    <button className="btn btn-outline-secondary btn-sm" disabled>{pagination.page} / {pagination.totalPages}</button>
                    <button className="btn btn-outline-secondary btn-sm" disabled={!pagination.hasNext || loading} onClick={() => { setCurrentPage(currentPage + 1); syncSearchParams(appliedStatus, currentPage + 1) }}>{t('actions.next', { defaultValue: 'Next' })} <i className="bx bx-chevron-right"></i></button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showModal && selectedMerchant && (
        <MerchantConfirmModal merchant={selectedMerchant} action={modalAction} loading={modalLoading} onConfirm={handleConfirm} onClose={closeModal} />
      )}
    </div>
  )
}
