'use client'

import { useEffect, useRef } from 'react'
import CoinImg from '@/components/CoinImg'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import Spinner from '@/components/ui/Spinner'

export default function CoinNetworkEditModal({ cn, form, setForm, onClose, onSave, saving, t }) {
  const coinSymbol = cn.coin?.symbol || '?'
  const networkSymbol = cn.network?.symbol || cn.network?.name || '?'

  const onCloseRef = useRef(onClose)
  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && !saving) onCloseRef.current()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [saving])

  function handleAmountChange(field, value) {
    if (value === '' || /^[0-9]*\.?[0-9]*$/.test(value)) {
      setForm((prev) => ({ ...prev, [field]: value }))
    }
  }

  function handleUsdChange(field, value) {
    if (value === '' || /^[0-9]*\.?[0-9]{0,2}$/.test(value)) {
      setForm((prev) => ({ ...prev, [field]: value }))
    }
  }

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/70 z-40"></div>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        tabIndex="-1"
        onClick={() => !saving && onClose()}
      >
        <div className="w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
          <div className="bg-card rounded-xl shadow-xl">
            <div className="flex items-center justify-between p-5 border-b border-surface-200 dark:border-surface-300">
              <h5 className="text-lg font-semibold text-surface-800 flex items-center gap-2">
                <CoinImg symbol={coinSymbol} size={24} />
                {t('admin.withdrawalSettings.editCnTitle', {
                  defaultValue: 'Edit Withdrawal — {{coin}} / {{network}}',
                  coin: coinSymbol,
                  network: networkSymbol,
                })}
              </h5>
              <button
                type="button"
                className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none"
                onClick={onClose}
                disabled={saving}
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className="p-5">
              {/* Withdraw Enabled Toggle */}
              <div className="flex items-center justify-between mb-4 p-3 rounded bg-surface-100 dark:bg-white/[0.03]">
                <div>
                  <span className="font-semibold">
                    {t('admin.withdrawalSettings.withdrawEnabled', { defaultValue: 'Withdraw Enabled' })}
                  </span>
                  <br />
                  <small className="text-surface-500">
                    {t('admin.withdrawalSettings.withdrawEnabledDesc', {
                      defaultValue: 'Allow users to withdraw this coin on this network',
                    })}
                  </small>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    checked={form.withdrawEnabled}
                    onChange={(e) => updateField('withdrawEnabled', e.target.checked)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-12 gap-x-6 gap-3">
                {/* Min Withdraw */}
                <div className="col-span-12 md:col-span-6">
                  <Label>{t('admin.withdrawalSettings.minWithdraw', { defaultValue: 'Min Withdraw Amount' })}</Label>
                  <Input
                    type="text"
                    placeholder="0.001"
                    value={form.minWithdrawAmount}
                    onChange={(e) => handleAmountChange('minWithdrawAmount', e.target.value)}
                  />
                </div>

                {/* Max Withdraw */}
                <div className="col-span-12 md:col-span-6">
                  <Label>{t('admin.withdrawalSettings.maxWithdraw', { defaultValue: 'Max Withdraw Amount' })}</Label>
                  <Input
                    type="text"
                    placeholder="1000"
                    value={form.maxWithdrawAmount}
                    onChange={(e) => handleAmountChange('maxWithdrawAmount', e.target.value)}
                  />
                </div>

                {/* Fee Base (read-only) */}
                <div className="col-span-12 md:col-span-6">
                  <Label>
                    {t('admin.withdrawalSettings.feeBase', { defaultValue: 'Fee Base' })}
                    <Badge color="info" label className="ml-2 text-[0.65rem]">
                      {t('admin.withdrawalSettings.autoCalculated', { defaultValue: 'Auto-calculated' })}
                    </Badge>
                  </Label>
                  <Input type="text" value={cn.withdrawFeeBase || '-'} disabled readOnly />
                  <small className="text-surface-500">
                    {t('admin.withdrawalSettings.feeBaseHint', { defaultValue: 'Managed by Base Fee Auto-Update' })}
                  </small>
                </div>

                {/* Fee Percent */}
                <div className="col-span-12 md:col-span-6">
                  <Label>{t('admin.withdrawalSettings.feePercent', { defaultValue: 'Fee Percent (%)' })}</Label>
                  <Input
                    type="text"
                    placeholder="1.5"
                    value={form.withdrawFeePercent}
                    onChange={(e) => handleAmountChange('withdrawFeePercent', e.target.value)}
                  />
                  <small className="text-surface-500">
                    {t('admin.withdrawalSettings.feePercentHint', {
                      defaultValue: 'Platform fee charged on withdrawal amount',
                    })}
                  </small>
                </div>

                {/* Daily Limit USD */}
                <div className="col-span-12 md:col-span-6">
                  <Label>
                    {t('admin.withdrawalSettings.dailyLimitUsd', { defaultValue: 'Daily Withdraw Limit (USD)' })}
                  </Label>
                  <Input
                    type="text"
                    placeholder="10000"
                    value={form.dailyWithdrawLimitUsd}
                    onChange={(e) => handleUsdChange('dailyWithdrawLimitUsd', e.target.value)}
                  />
                  <small className="text-surface-500">
                    {t('admin.withdrawalSettings.dailyLimitHint', {
                      defaultValue: 'Max USD value per user per day (empty = no limit)',
                    })}
                  </small>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200 dark:border-surface-300">
              <Button type="button" onClick={onClose} disabled={saving} variant="outline-secondary">
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </Button>
              <Button type="button" onClick={onSave} disabled={saving}>
                {saving ? (
                  <>
                    <Spinner className="w-4 h-4 mr-2" />
                    {t('actions.saving', { defaultValue: 'Saving...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-save mr-1"></i>
                    {t('actions.save', { defaultValue: 'Save' })}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
