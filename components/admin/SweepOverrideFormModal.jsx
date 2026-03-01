'use client'

import { useTranslation } from 'react-i18next'

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
  onClose
}) {
  const { t } = useTranslation()

  if (!show) return null

  const isCoin = type === 'coin'

  const title = isCoin
    ? (isEditing
        ? t('admin.sweep.editCoinOverride', { defaultValue: 'Edit Coin Override' })
        : t('admin.sweep.addCoinOverride', { defaultValue: 'Add Coin Override' }))
    : (isEditing
        ? t('admin.sweep.editNetworkOverride', { defaultValue: 'Edit Network Override' })
        : t('admin.sweep.addNetworkOverride', { defaultValue: 'Add Network Override' }))

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
    <>
      <div className="modal-backdrop fade show"></div>
      <div className="modal fade show d-block" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label">{idLabel} *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder={idPlaceholder}
                    value={idValue}
                    onChange={handleIdChange}
                    disabled={isEditing}
                    maxLength={20}
                  />
                  {!isCoin && (
                    <small className="text-muted">
                      {t('admin.sweep.coinNetworkIdHelp', { defaultValue: 'Numeric coin_network_id' })}
                    </small>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('admin.sweep.minBalance', { defaultValue: 'Min Balance' })}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0.0001"
                    value={form.minBalance}
                    onChange={(e) => handleNumericField('minBalance', e.target.value)}
                    maxLength={20}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">{t('admin.sweep.gasBuffer', { defaultValue: 'Gas Buffer' })}</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="0.00005"
                    value={form.gasBuffer}
                    onChange={(e) => handleNumericField('gasBuffer', e.target.value)}
                    maxLength={20}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                {t('actions.cancel', { defaultValue: 'Cancel' })}
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={onSave}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    {t('actions.saving', { defaultValue: 'Saving...' })}
                  </>
                ) : (
                  <>
                    <i className="bx bx-save me-1"></i>
                    {t('actions.save', { defaultValue: 'Save' })}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
