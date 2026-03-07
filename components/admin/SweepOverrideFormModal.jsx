'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import Button from '../ui/Button'
import { Input, Label } from '../ui/Input'
import Spinner from '../ui/Spinner'

/**
 * Modal form for adding/editing a coin or network sweep override.
 *
 * @param {Object} props
 * @param {'coin'|'network'} props.type - Whether this modal edits a coin or network override
 * @param {boolean} props.show - Whether the modal is visible
 * @param {boolean} props.loading - Disables inputs and shows spinner when true
 * @param {boolean} props.isEditing - True when editing an existing override (disables the ID field)
 * @param {Object} props.form - The form state object ({ coin, minBalance, gasBuffer } or { coinNetworkId, minBalance, gasBuffer })
 * @param {Function} props.onFormChange - Called with the updated form object
 * @param {Function} props.onSave - Called when the Save button is clicked
 * @param {Function} props.onClose - Called when the modal should close
 */
export default function SweepOverrideFormModal({
  type,
  show,
  loading,
  isEditing,
  form,
  onFormChange,
  onSave,
  onClose,
}) {
  const { t } = useAdminTranslation()

  if (!show) return null

  const isCoin = type === 'coin'

  const title = isCoin
    ? isEditing
      ? t('admin.sweep.editCoinOverride', { defaultValue: 'Edit Coin Override' })
      : t('admin.sweep.addCoinOverride', { defaultValue: 'Add Coin Override' })
    : isEditing
      ? t('admin.sweep.editNetworkOverride', { defaultValue: 'Edit Network Override' })
      : t('admin.sweep.addNetworkOverride', { defaultValue: 'Add Network Override' })

  const idLabel = isCoin
    ? t('admin.sweep.coinSymbol', { defaultValue: 'Coin Symbol' })
    : t('admin.sweep.coinNetworkId', { defaultValue: 'Coin-Network ID' })

  const idPlaceholder = isCoin ? 'BTC, ETH, USDT...' : '1, 2, 3...'
  const idFieldKey = isCoin ? 'coin' : 'coinNetworkId'
  const idValue = form[idFieldKey] || ''

  function handleIdChange(e) {
    const value = e.target.value
    if (isCoin) {
      const upper = value.toUpperCase()
      if (/^[A-Z0-9]*$/.test(upper) && upper.length <= 20) {
        onFormChange({ ...form, coin: upper })
      }
    } else {
      if (/^[0-9]*$/.test(value) && value.length <= 20) {
        onFormChange({ ...form, coinNetworkId: value })
      }
    }
  }

  function handleNumericField(field, value) {
    if (/^[0-9.]*$/.test(value) && value.length <= 20) {
      onFormChange({ ...form, [field]: value })
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      tabIndex="-1"
      onClick={() => !loading && onClose()}
    >
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-card rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">{title}</h5>
            <button
              type="button"
              className="cursor-pointer text-surface-500 hover:text-surface-700 text-xl leading-none"
              onClick={onClose}
              disabled={loading}
            >
              <i className="bx bx-x"></i>
            </button>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-12 gap-x-6 gap-3">
              <div className="col-span-12">
                <Label>{idLabel} *</Label>
                <Input
                  type="text"
                  placeholder={idPlaceholder}
                  value={idValue}
                  onChange={handleIdChange}
                  disabled={isEditing}
                  maxLength={20}
                />

                {!isCoin && (
                  <small className="text-surface-500">
                    {t('admin.sweep.coinNetworkIdHelp', { defaultValue: 'Numeric coin_network_id' })}
                  </small>
                )}
              </div>
              <div className="col-span-12 md:col-span-6">
                <Label>{t('admin.sweep.minBalance', { defaultValue: 'Min Balance' })}</Label>
                <Input
                  type="text"
                  placeholder="0.0001"
                  value={form.minBalance}
                  onChange={(e) => handleNumericField('minBalance', e.target.value)}
                  maxLength={20}
                />
              </div>
              <div className="col-span-12 md:col-span-6">
                <Label>{t('admin.sweep.gasBuffer', { defaultValue: 'Gas Buffer' })}</Label>
                <Input
                  type="text"
                  placeholder="0.00005"
                  value={form.gasBuffer}
                  onChange={(e) => handleNumericField('gasBuffer', e.target.value)}
                  maxLength={20}
                />
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <Button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-surface-200 text-surface-700 hover:bg-surface-300"
            >
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="button" onClick={onSave} disabled={loading}>
              {loading ? (
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
  )
}
