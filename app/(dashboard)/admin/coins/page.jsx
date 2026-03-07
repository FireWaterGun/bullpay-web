'use client'

import { useEffect, useState, useCallback } from 'react'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import { useAuth } from '@/app/providers'
import { getCoins } from '@/lib/api/admin'
import CoinImg from '@/components/CoinImg'
import CoinEditModal from '@/components/admin/CoinEditModal'
import TableEmptyState from '@/components/TableEmptyState'
import Alert from '@/components/ui/Alert'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import { Input, Label } from '@/components/ui/Input'
import Pagination from '@/components/ui/Pagination'
import Table from '@/components/ui/Table'

const DEFAULT_PAGINATION = { page: 1, limit: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: false }

function CoinRow({ coin, t, onEdit }) {
  return (
    <tr>
      <td className="align-middle">
        <div className="flex items-center">
          <CoinImg symbol={coin.symbol} logoUrl={coin.logoUrl} size={28} className="mr-2" showFallback />
          <div>
            <div className="font-medium">{coin.name || 'N/A'}</div>
          </div>
        </div>
      </td>
      <td className="align-middle">
        <span className="font-medium">{coin.symbol}</span>
      </td>
      <td className="text-center align-middle">
        {coin.type === 'native'
          ? t('crypto.native', { defaultValue: 'Native' })
          : t('crypto.token', { defaultValue: 'Token' })}
      </td>
      <td className="text-center align-middle">{coin.decimals || 0}</td>
      <td className="text-center align-middle">
        {coin.status === 'active' ? (
          <Badge color="success" label>
            {t('admin.active')}
          </Badge>
        ) : (
          <Badge color="secondary">{coin.status}</Badge>
        )}
      </td>
      <td className="text-center align-middle">
        <Button
          title={t('actions.edit', { defaultValue: 'Edit' })}
          onClick={() => onEdit(coin.id)}
          variant="text-secondary"
          size="icon-sm"
        >
          <i className="bx bx-edit text-[1rem]"></i>
        </Button>
      </td>
    </tr>
  )
}

export default function CoinList() {
  const { t } = useAdminTranslation()
  const { token } = useAuth()
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [draftSearch, setDraftSearch] = useState('')
  const [pagination, setPagination] = useState(DEFAULT_PAGINATION)
  const [editCoinId, setEditCoinId] = useState(null)

  const loadCoins = useCallback(
    async ({ page = 1, limit = 10, search = '' } = {}) => {
      setLoading(true)
      setError('')
      try {
        const response = await getCoins(token, page, limit, search)
        const coinList = response?.items || []
        const pd = response?.pagination || {}
        setCoins(coinList)
        setPagination({
          page: pd.page || page,
          limit: pd.limit || limit,
          total: pd.total || 0,
          totalPages: pd.totalPages || 0,
          hasNext: pd.hasNext || false,
          hasPrev: pd.hasPrev || false,
        })
      } catch (e) {
        setError(e?.message || 'Failed to load coins')
      } finally {
        setLoading(false)
      }
    },
    [token]
  )

  useEffect(() => {
    loadCoins()
  }, [loadCoins])

  function handleApplyFilter() {
    setSearchQuery(draftSearch)
    loadCoins({ page: 1, limit: pagination.limit, search: draftSearch })
  }

  function handleResetFilter() {
    setDraftSearch('')
    setSearchQuery('')
    loadCoins({ page: 1, limit: pagination.limit, search: '' })
  }

  function handlePageChange(newPage) {
    loadCoins({ page: newPage, limit: pagination.limit, search: searchQuery })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="grow pb-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="mb-1">
            <i className="bx bx-coin mr-2 text-primary"></i>
            {t('nav.coins', { defaultValue: 'Coins' })}
          </h4>
          <p className="text-surface-500 mb-0">
            {t('crypto.manageCoinsList', { defaultValue: 'Manage cryptocurrency coins' })}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-4">
        <div className="p-5">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="w-full sm:w-auto sm:min-w-[280px] sm:flex-1 sm:max-w-sm">
              <Label>{t('filter.search', { defaultValue: 'Search' })}</Label>
              <Input
                type="text"
                placeholder={t('crypto.searchCoins', { defaultValue: 'Search by name or symbol...' })}
                value={draftSearch}
                onChange={(e) => setDraftSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              />
            </div>
            <div className="flex gap-2 shrink-0">
              <Button onClick={handleApplyFilter} disabled={loading}>
                <i className="bx bx-filter-alt mr-1"></i>
                {t('filter.apply', { defaultValue: 'Apply Filters' })}
              </Button>
              <Button onClick={handleResetFilter} disabled={loading} variant="outline-secondary">
                <i className="bx bx-reset mr-1"></i>
                {t('filter.reset', { defaultValue: 'Reset' })}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        {/* Error Alert */}
        {error && (
          <div className="p-5">
            <Alert role="alert" className="mb-0">
              <i className="bx bx-error-circle mr-2"></i>
              {error}
            </Alert>
          </div>
        )}

        {/* Table */}
        <Table>
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
          <tbody className={loading ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            {coins.length === 0 ? (
              <TableEmptyState
                colSpan={6}
                icon="bx-coin"
                message={
                  searchQuery
                    ? t('crypto.noSearchResults', { defaultValue: 'No coins found matching your search' })
                    : t('crypto.noCoins', { defaultValue: 'No coins found' })
                }
              />
            ) : (
              coins.map((coin) => <CoinRow key={coin.id} coin={coin} t={t} onEdit={setEditCoinId} />)
            )}
          </tbody>
        </Table>

        {/* Pagination */}
        {!error && coins.length > 0 && (
          <Pagination
            pagination={pagination}
            onPageChange={handlePageChange}
            loading={loading}
            className="px-5 py-3 border-t border-surface-200 mt-0"
          />
        )}
      </Card>

      {editCoinId && (
        <CoinEditModal
          coinId={editCoinId}
          onClose={() => setEditCoinId(null)}
          onSaved={() => loadCoins({ page: pagination.page, limit: pagination.limit, search: searchQuery })}
        />
      )}
    </div>
  )
}
