'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { getSystemWalletStats, adjustSystemBalance } from '@/lib/api/admin';
import CoinImg from '@/components/CoinImg';
import { logger } from '@/lib/utils/logger';
import { Alert, Badge, Button, Input, InputGroup, InputAddon, Label, Select, Spinner } from '../ui';

/**
 * AdjustmentModal — Manual system balance adjustment (XI/XO)
 *
 * Allows super_admin to increase (XI) or decrease (XO) a system wallet balance.
 * Used from the Revenue & Expenses (platform-ledger) page.
 */
export default function AdjustmentModal({ t, onClose, onSuccess }) {
  const { token } = useAuth();

  const [wallets, setWallets] = useState([]);
  const [loadingWallets, setLoadingWallets] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [selectedAssetKey, setSelectedAssetKey] = useState('');
  const [direction, setDirection] = useState('in');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [txHash, setTxHash] = useState('');

  // Load system wallets on mount
  useEffect(() => {
    loadWallets();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadWallets() {
    try {
      setLoadingWallets(true);
      const stats = await getSystemWalletStats(token, 'USD');
      const details = stats?.balanceDetails || [];
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
        confirmedBalance: d.confirmedBalance || '0'
      }));
      setWallets(items);
      if (items.length > 0) setSelectedAssetKey(items[0].key);
    } catch (err) {
      logger.error('Failed to load wallets for adjustment:', err);
    } finally {
      setLoadingWallets(false);
    }
  }

  const selectedWallet = wallets.find((w) => w.key === selectedAssetKey);

  // Validation
  const amountTrimmed = amount.trim();
  const reasonTrimmed = reason.trim();
  const isValidAmount = amountTrimmed && /^(?:0\.\d+|[1-9]\d*(?:\.\d+)?)$/.test(amountTrimmed);
  const isValidReason = reasonTrimmed.length >= 10 && reasonTrimmed.length <= 500;
  const isValid = selectedWallet && isValidAmount && isValidReason;

  async function handleSubmit() {
    if (!isValid || !selectedWallet) return;
    try {
      setSubmitting(true);
      await adjustSystemBalance(token, {
        walletId: selectedWallet.walletId,
        coinNetworkId: selectedWallet.coinNetworkId,
        direction,
        amount: amountTrimmed,
        reason: reasonTrimmed,
        txHash: txHash.trim() || null
      });
      onSuccess(direction);
      onClose();
    } catch (err) {
      logger.error('Adjustment failed:', err);
      const code = err?.code;
      if (code === 'INSUFFICIENT_BALANCE') {
        onSuccess('error:insufficient');
      } else {
        onSuccess('error');
      }
    } finally {
      setSubmitting(false);
    }
  }

  const disabled = submitting || loadingWallets;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !disabled && onClose()}>
      <div className="w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              <i className="bx bx-transfer-alt mr-2"></i>
              {t('admin.adjustment.title', { defaultValue: 'Balance Adjustment (XI / XO)' })}
            </h5>
            <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none" onClick={onClose} disabled={disabled}><i className="bx bx-x"></i></button>
          </div>
          <div className="p-5">
            {/* Warning alert */}
            <Alert role="alert" variant="warning" className="flex items-start mb-4">
              <i className="bx bx-error-circle mr-2 mt-1"></i>
              <div>
                <strong>{t('admin.adjustment.warning', { defaultValue: 'Warning' })}</strong>
                <p className="mb-0 mt-1 text-sm">
                  {t('admin.adjustment.warningText', { defaultValue: 'This action directly modifies system wallet balances. Please verify all details carefully before submitting.' })}
                </p>
              </div>
            </Alert>

            {/* Wallet selector */}
            <div className="mb-3">
              <Label>
                {t('admin.adjustment.wallet', { defaultValue: 'System Wallet' })} <span className="text-danger">*</span>
              </Label>
              {loadingWallets ?
              <div className="flex items-center gap-2 py-2">
                  <Spinner role="status" className="w-4 h-4 text-primary" />
                  <span className="text-surface-500 text-sm">{t('admin.adjustment.loadingWallets', { defaultValue: 'Loading wallets...' })}</span>
                </div> :
              wallets.length === 0 ?
              <div className="text-surface-500 text-sm py-2">
                  {t('admin.adjustment.noWallets', { defaultValue: 'No wallets found with balance' })}
                </div> :

              <Select

                value={selectedAssetKey}
                onChange={(e) => setSelectedAssetKey(e.target.value)}
                disabled={disabled}>
                
                  {wallets.map((w) =>
                <option key={w.key} value={w.key}>
                      {w.walletName} — {w.coinSymbol} ({w.networkName}) — {t('admin.adjustment.balance', { defaultValue: 'Balance' })}: {w.confirmedBalance}
                    </option>
                )}
                </Select>
              }
              {selectedWallet &&
              <div className="flex items-center gap-2 mt-2">
                  <CoinImg symbol={selectedWallet.coinSymbol} networkSymbol={selectedWallet.networkSymbol} size={20} />
                  <small className="text-surface-500">
                    {selectedWallet.coinSymbol} on {selectedWallet.networkName}
                    {' · '}
                    <Badge className="bg-surface-100 text-surface-600">{selectedWallet.purpose}</Badge>
                  </small>
                </div>
              }
            </div>

            {/* Direction */}
            <div className="mb-3">
              <Label>
                {t('admin.adjustment.direction', { defaultValue: 'Direction' })} <span className="text-danger">*</span>
              </Label>
              <div className="flex gap-3">
                <div className="flex items-center gap-2">
                  <input
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    type="radio"
                    name="direction"
                    id="dir-in"
                    value="in"
                    checked={direction === 'in'}
                    onChange={() => setDirection('in')}
                    disabled={disabled} />
                  
                  <label className="text-sm text-surface-700 text-success font-medium" htmlFor="dir-in">
                    <i className="bx bx-plus-circle mr-1"></i>
                    XI — {t('admin.adjustment.increase', { defaultValue: 'Increase' })}
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
                    type="radio"
                    name="direction"
                    id="dir-out"
                    value="out"
                    checked={direction === 'out'}
                    onChange={() => setDirection('out')}
                    disabled={disabled} />
                  
                  <label className="text-sm text-surface-700 text-danger font-medium" htmlFor="dir-out">
                    <i className="bx bx-minus-circle mr-1"></i>
                    XO — {t('admin.adjustment.decrease', { defaultValue: 'Decrease' })}
                  </label>
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="mb-3">
              <Label>
                {t('admin.adjustment.amount', { defaultValue: 'Amount' })} <span className="text-danger">*</span>
              </Label>
              <InputGroup>
                <Input
                  type="text"

                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  maxLength={40}
                  disabled={disabled}
                  autoFocus />
                
                {selectedWallet &&
                <InputAddon>{selectedWallet.coinSymbol}</InputAddon>
                }
              </InputGroup>
              {amountTrimmed && !isValidAmount &&
              <small className="text-danger">
                  {t('admin.adjustment.invalidAmount', { defaultValue: 'Enter a valid positive number (e.g. 1.5, 100)' })}
                </small>
              }
            </div>

            {/* Reason */}
            <div className="mb-3">
              <Label>
                {t('admin.adjustment.reason', { defaultValue: 'Reason' })} <span className="text-danger">*</span>
              </Label>
              <Input

                rows={3}
                placeholder={t('admin.adjustment.reasonPlaceholder', { defaultValue: 'Describe why this adjustment is needed (min 10 characters)' })}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={500}
                disabled={disabled} />
              
              <small className={`${reasonTrimmed.length > 0 && reasonTrimmed.length < 10 ? 'text-danger' : 'text-surface-500'}`}>
                {reasonTrimmed.length}/500
                {reasonTrimmed.length > 0 && reasonTrimmed.length < 10 &&
                <> — {t('admin.adjustment.reasonTooShort', { defaultValue: 'Minimum 10 characters' })}</>
                }
              </small>
            </div>

            {/* Tx Hash (optional) */}
            <div className="mb-3">
              <Label>
                {t('admin.adjustment.txHash', { defaultValue: 'Tx Hash' })} <span className="text-surface-500 text-sm">({t('admin.adjustment.optional', { defaultValue: 'optional' })})</span>
              </Label>
              <Input
                type="text"

                placeholder="0x..."
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                maxLength={191}
                disabled={disabled} />
              
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <Button type="button" onClick={onClose} disabled={disabled} variant="outline-secondary">
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button
              type="button"

              onClick={handleSubmit}
              disabled={!isValid || disabled}>
              
              {submitting ?
              <>
                  <Spinner role="status" className="w-4 h-4 mr-2" />
                  {t('actions.submitting', { defaultValue: 'Submitting...' })}
                </> :

              <>
                  <i className={`bx ${direction === 'in' ? 'bx-plus-circle' : 'bx-minus-circle'} mr-1`}></i>
                  {direction === 'in' ?
                t('admin.adjustment.submitIncrease', { defaultValue: 'Apply XI (Increase)' }) :
                t('admin.adjustment.submitDecrease', { defaultValue: 'Apply XO (Decrease)' })
                }
                </>
              }
            </Button>
          </div>
        </div>
      </div>
    </div>);

}