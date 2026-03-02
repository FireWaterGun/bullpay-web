'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/providers'
import { getSystemWalletStats, adjustSystemBalance } from '@/lib/api/admin'
import CoinImg from '@/components/CoinImg'
import { logger } from '@/lib/utils/logger'

/**
 * AdjustmentModal — Manual system balance adjustment (XI/XO)
 *
 * Allows super_admin to increase (XI) or decrease (XO) a system wallet balance.
 * Used from the Revenue & Expenses (platform-ledger) page.
 */
export default function AdjustmentModal({ t, onClose, onSuccess }) {
  const { token } = useAuth()

  const [wallets, setWallets] = useState([])
  const [loadingWallets, setLoadingWallets] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form fields
  const [selectedAssetKey, setSelectedAssetKey] = useState('')
  const [direction, setDirection] = useState('in')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [txHash, setTxHash] = useState('')

  // Load system wallets on mount
  useEffect(() => {
    loadWallets()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadWallets() {
    try {
      setLoadingWallets(true)
      const stats = await getSystemWalletStats(token, 'USD')
      const details = stats?.balanceDetails || []
      // Build flat list: each entry = one wallet+asset combo
      const items = details.map((d) => ({
        key: `${d.systemWalletId}-${d.coinNetworkId}`,
        walletId: d.systemWalletId,
        coinNetworkId: d.coinNetworkId,
        walletName: d.systemWallet?.walletName || `Wallet #${d.systemWalletId}`,
        purpose: d.systemWallet?.purpose || '',
        coinSymbol: d.systemWallet?.coinNetwork?.coin?.symbol || '?',
        networkSymbol: d.systemWallet?.coinNetwork?.network?.symbol || '',
        networkName: d.systemWallet?.coinNetwork?.network?.name || '',
        confirmedBalance: d.confirmedBalance || '0',
      }))
      setWallets(items)
      if (items.length > 0) setSelectedAssetKey(items[0].key)
    } catch (err) {
      logger.error('Failed to load wallets for adjustment:', err)
    } finally {
      setLoadingWallets(false)
    }
  }

  const selectedWallet = wallets.find((w) => w.key === selectedAssetKey)

  // Validation
  const amountTrimmed = amount.trim()
  const reasonTrimmed = reason.trim()
  const isValidAmount = amountTrimmed && /^(?:0\.\d+|[1-9]\d*(?:\.\d+)?)$/.test(amountTrimmed)
  const isValidReason = reasonTrimmed.length >= 10 && reasonTrimmed.length <= 500
  const isValid = selectedWallet && isValidAmount && isValidReason

  async function handleSubmit() {
    if (!isValid || !selectedWallet) return
    try {
      setSubmitting(true)
      await adjustSystemBalance(token, {
        walletId: selectedWallet.walletId,
        coinNetworkId: selectedWallet.coinNetworkId,
        direction,
        amount: amountTrimmed,
        reason: reasonTrimmed,
        txHash: txHash.trim() || null,
      })
      onSuccess(direction)
      onClose()
    } catch (err) {
      logger.error('Adjustment failed:', err)
      const code = err?.code
      if (code === 'INSUFFICIENT_BALANCE') {
        onSuccess('error:insufficient')
      } else {
        onSuccess('error')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const disabled = submitting || loadingWallets

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !disabled && onClose()}>
      <div className="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bx bx-transfer-alt me-2"></i>
              {t('admin.adjustment.title', { defaultValue: 'Balance Adjustment (XI / XO)' })}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={disabled}></button>
          </div>
          <div className="modal-body">
            {/* Warning alert */}
            <div className="alert alert-warning d-flex align-items-start mb-4" role="alert">
              <i className="bx bx-error-circle me-2 mt-1"></i>
              <div>
                <strong>{t('admin.adjustment.warning', { defaultValue: 'Warning' })}</strong>
                <p className="mb-0 mt-1 small">
                  {t('admin.adjustment.warningText', { defaultValue: 'This action directly modifies system wallet balances. Please verify all details carefully before submitting.' })}
                </p>
              </div>
            </div>

            {/* Wallet selector */}
            <div className="mb-3">
              <label className="form-label">
                {t('admin.adjustment.wallet', { defaultValue: 'System Wallet' })} <span className="text-danger">*</span>
              </label>
              {loadingWallets ? (
                <div className="d-flex align-items-center gap-2 py-2">
                  <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                  <span className="text-muted small">{t('admin.adjustment.loadingWallets', { defaultValue: 'Loading wallets...' })}</span>
                </div>
              ) : wallets.length === 0 ? (
                <div className="text-muted small py-2">
                  {t('admin.adjustment.noWallets', { defaultValue: 'No wallets found with balance' })}
                </div>
              ) : (
                <select
                  className="form-select"
                  value={selectedAssetKey}
                  onChange={(e) => setSelectedAssetKey(e.target.value)}
                  disabled={disabled}
                >
                  {wallets.map((w) => (
                    <option key={w.key} value={w.key}>
                      {w.walletName} — {w.coinSymbol} ({w.networkName}) — {t('admin.adjustment.balance', { defaultValue: 'Balance' })}: {w.confirmedBalance}
                    </option>
                  ))}
                </select>
              )}
              {selectedWallet && (
                <div className="d-flex align-items-center gap-2 mt-2">
                  <CoinImg symbol={selectedWallet.coinSymbol} networkSymbol={selectedWallet.networkSymbol} size={20} />
                  <small className="text-muted">
                    {selectedWallet.coinSymbol} on {selectedWallet.networkName}
                    {' · '}
                    <span className="badge bg-label-secondary">{selectedWallet.purpose}</span>
                  </small>
                </div>
              )}
            </div>

            {/* Direction */}
            <div className="mb-3">
              <label className="form-label">
                {t('admin.adjustment.direction', { defaultValue: 'Direction' })} <span className="text-danger">*</span>
              </label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="direction"
                    id="dir-in"
                    value="in"
                    checked={direction === 'in'}
                    onChange={() => setDirection('in')}
                    disabled={disabled}
                  />
                  <label className="form-check-label text-success fw-medium" htmlFor="dir-in">
                    <i className="bx bx-plus-circle me-1"></i>
                    XI — {t('admin.adjustment.increase', { defaultValue: 'Increase' })}
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="direction"
                    id="dir-out"
                    value="out"
                    checked={direction === 'out'}
                    onChange={() => setDirection('out')}
                    disabled={disabled}
                  />
                  <label className="form-check-label text-danger fw-medium" htmlFor="dir-out">
                    <i className="bx bx-minus-circle me-1"></i>
                    XO — {t('admin.adjustment.decrease', { defaultValue: 'Decrease' })}
                  </label>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="mb-3">
              <label className="form-label">
                {t('admin.adjustment.amount', { defaultValue: 'Amount' })} <span className="text-danger">*</span>
              </label>
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  maxLength={40}
                  disabled={disabled}
                  autoFocus
                />
                {selectedWallet && (
                  <span className="input-group-text">{selectedWallet.coinSymbol}</span>
                )}
              </div>
              {amountTrimmed && !isValidAmount && (
                <small className="text-danger">
                  {t('admin.adjustment.invalidAmount', { defaultValue: 'Enter a valid positive number (e.g. 1.5, 100)' })}
                </small>
              )}
            </div>

            {/* Reason */}
            <div className="mb-3">
              <label className="form-label">
                {t('admin.adjustment.reason', { defaultValue: 'Reason' })} <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                rows={3}
                placeholder={t('admin.adjustment.reasonPlaceholder', { defaultValue: 'Describe why this adjustment is needed (min 10 characters)' })}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                disabled={disabled}
              />
              <small className={`${reasonTrimmed.length > 0 && reasonTrimmed.length < 10 ? 'text-danger' : 'text-muted'}`}>
                {reasonTrimmed.length}/500
                {reasonTrimmed.length > 0 && reasonTrimmed.length < 10 && (
                  <> — {t('admin.adjustment.reasonTooShort', { defaultValue: 'Minimum 10 characters' })}</>
                )}
              </small>
            </div>

            {/* Tx Hash (optional) */}
            <div className="mb-3">
              <label className="form-label">
                {t('admin.adjustment.txHash', { defaultValue: 'Tx Hash' })} <span className="text-muted small">({t('admin.adjustment.optional', { defaultValue: 'optional' })})</span>
              </label>
              <input
                type="text"
                className="form-control"
                placeholder="0x..."
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                maxLength={191}
                disabled={disabled}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={disabled}>
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              type="button"
              className={`btn ${direction === 'in' ? 'btn-success' : 'btn-danger'}`}
              onClick={handleSubmit}
              disabled={!isValid || disabled}
            >
              {submitting ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  {t('actions.submitting', { defaultValue: 'Submitting...' })}
                </>
              ) : (
                <>
                  <i className={`bx ${direction === 'in' ? 'bx-plus-circle' : 'bx-minus-circle'} me-1`}></i>
                  {direction === 'in'
                    ? t('admin.adjustment.submitIncrease', { defaultValue: 'Apply XI (Increase)' })
                    : t('admin.adjustment.submitDecrease', { defaultValue: 'Apply XO (Decrease)' })
                  }
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
