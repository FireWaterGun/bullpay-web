'use client'

import { useTranslation } from 'react-i18next'

/**
 * Form fields for the network create/edit form.
 * Renders all input fields inside a Bootstrap row grid.
 */
export default function NetworkFormFields({ formData, handleChange, isEdit, loading, onCancel }) {
  const { t } = useTranslation()

  return (
    <div className="row g-4">
      {/* Name */}
      <div className="col-md-6">
        <label className="form-label" htmlFor="name">
          {t('crypto.networkName', { defaultValue: 'Network Name' })} <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control form-control-lg"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ethereum"
          maxLength={100}
          required
        />
        <small className="text-muted">{t('crypto.networkNameHelp', { defaultValue: 'Full network name' })}</small>
      </div>

      {/* Symbol */}
      <div className="col-md-6">
        <label className="form-label" htmlFor="symbol">
          {t('crypto.symbol', { defaultValue: 'Symbol' })} <span className="text-danger">*</span>
        </label>
        <input
          type="text"
          className="form-control form-control-lg"
          id="symbol"
          name="symbol"
          value={formData.symbol}
          onChange={handleChange}
          placeholder="ETH"
          maxLength={20}
          pattern="[A-Za-z0-9]+"
          required
          disabled={isEdit}
          style={{ textTransform: 'uppercase' }}
        />
        <small className="text-muted">{t('crypto.symbolHelp', { defaultValue: 'Network symbol (e.g., ETH, BSC)' })}</small>
      </div>

      {/* Type */}
      <div className="col-md-6">
        <label className="form-label" htmlFor="type">
          {t('crypto.networkType', { defaultValue: 'Network Type' })} <span className="text-danger">*</span>
        </label>
        <select
          className="form-select form-select-lg"
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          disabled={isEdit}
        >
          <option value="mainnet">Mainnet</option>
          <option value="testnet">Testnet</option>
          <option value="devnet">Devnet</option>
          <option value="layer2">Layer 2</option>
          <option value="sidechain">Sidechain</option>
        </select>
        <small className="text-muted">{t('crypto.networkTypeHelp', { defaultValue: 'Type of blockchain network' })}</small>
      </div>

      {/* Chain ID */}
      <div className="col-md-6">
        <label className="form-label" htmlFor="chainId">
          {t('crypto.chainId', { defaultValue: 'Chain ID' })}
        </label>
        <input
          type="number"
          className="form-control form-control-lg"
          id="chainId"
          name="chainId"
          value={formData.chainId}
          onChange={handleChange}
          placeholder="1"
          min="1"
        />
        <small className="text-muted">{t('crypto.chainIdHelp', { defaultValue: 'EVM chain ID (leave empty for non-EVM)' })}</small>
      </div>

      {/* Confirmation Blocks */}
      <div className="col-md-6">
        <label className="form-label" htmlFor="confirmationBlocks">
          {t('crypto.confirmationBlocks', { defaultValue: 'Confirmation Blocks' })} <span className="text-danger">*</span>
        </label>
        <input
          type="number"
          className="form-control form-control-lg"
          id="confirmationBlocks"
          name="confirmationBlocks"
          value={formData.confirmationBlocks}
          onChange={handleChange}
          min="1"
          max="1000"
          required
        />
        <small className="text-muted">{t('crypto.confirmationBlocksHelp', { defaultValue: 'Number of blocks for confirmation' })}</small>
      </div>

      {/* RPC URL */}
      <div className="col-12">
        <label className="form-label" htmlFor="rpcUrl">
          {t('crypto.rpcUrl', { defaultValue: 'RPC URL' })}
        </label>
        <input
          type="url"
          className="form-control form-control-lg"
          id="rpcUrl"
          name="rpcUrl"
          value={formData.rpcUrl}
          onChange={handleChange}
          placeholder="https://eth.llamarpc.com"
        />
        <small className="text-muted">{t('crypto.rpcUrlHelp', { defaultValue: 'Blockchain RPC endpoint' })}</small>
      </div>

      {/* Explorer URL */}
      <div className="col-12">
        <label className="form-label" htmlFor="explorerUrl">
          {t('crypto.explorerUrl', { defaultValue: 'Explorer URL' })}
        </label>
        <input
          type="url"
          className="form-control form-control-lg"
          id="explorerUrl"
          name="explorerUrl"
          value={formData.explorerUrl}
          onChange={handleChange}
          placeholder="https://etherscan.io"
        />
        <small className="text-muted">{t('crypto.explorerUrlHelp', { defaultValue: 'Block explorer URL' })}</small>
      </div>

      {/* API URL */}
      <div className="col-12">
        <label className="form-label" htmlFor="apiUrl">
          {t('crypto.apiUrl', { defaultValue: 'API URL' })}
        </label>
        <input
          type="url"
          className="form-control form-control-lg"
          id="apiUrl"
          name="apiUrl"
          value={formData.apiUrl}
          onChange={handleChange}
          placeholder="https://api.etherscan.io/api"
        />
        <small className="text-muted">{t('crypto.apiUrlHelp', { defaultValue: 'External API endpoint (e.g., Etherscan API)' })}</small>
      </div>

      {/* Status */}
      <div className="col-md-6">
        <label className="form-label" htmlFor="status">
          {t('invoices.statusCol')}
        </label>
        <select
          className="form-select form-select-lg"
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
        >
          <option value="active">{t('admin.active', { defaultValue: 'Active' })}</option>
          <option value="inactive">{t('crypto.inactive', { defaultValue: 'Inactive' })}</option>
          <option value="maintenance">{t('crypto.maintenance', { defaultValue: 'Maintenance' })}</option>
          <option value="deprecated">{t('crypto.deprecated', { defaultValue: 'Deprecated' })}</option>
        </select>
      </div>

      {/* Is Testnet */}
      <div className="col-12">
        <div className="form-check form-check-lg">
          <input
            className="form-check-input"
            type="checkbox"
            id="isTestnet"
            name="isTestnet"
            checked={formData.isTestnet}
            onChange={handleChange}
          />
          <label className="form-check-label" htmlFor="isTestnet">
            {t('crypto.isTestnet', { defaultValue: 'Testnet' })}
          </label>
        </div>
        <small className="text-muted ms-4">{t('crypto.isTestnetHelp', { defaultValue: 'Check if this is a test network' })}</small>
      </div>

      {/* Actions */}
      <div className="col-12 pt-3">
        <div className="d-flex gap-3 justify-content-between">
          {/* Delete button - Hidden */}
          {false && isEdit && (
            <button
              type="button"
              className="btn btn-lg btn-danger"
              disabled={loading}
            >
              <i className="bx bx-trash me-2"></i>
              {t('actions.delete', { defaultValue: 'Delete' })}
            </button>
          )}

          <div className={`d-flex gap-3 ms-auto`}>
            <button
              type="button"
              className="btn btn-lg btn-label-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              type="submit"
              className="btn btn-lg btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  {t('actions.saving', { defaultValue: 'Saving...' })}
                </>
              ) : (
                <>
                  <i className="bx bx-save me-2"></i>
                  {isEdit ? t('actions.update', { defaultValue: 'Update' }) : t('actions.create', { defaultValue: 'Create' })}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
