'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'
import Button from '../ui/Button'
import { Input, Label, Select } from '../ui/Input'
import Spinner from '../ui/Spinner'

/**
 * Form fields for the network create/edit form.
 */
export default function NetworkFormFields({ formData, handleChange, isEdit, loading, onCancel }) {
  const { t } = useAdminTranslation()

  return (
    <div className="grid grid-cols-12 gap-x-6 gap-4">
      {/* Name */}
      <div className="col-span-12 md:col-span-6">
        <Label htmlFor="name">
          {t('crypto.networkName', { defaultValue: 'Network Name' })} <span className="text-danger">*</span>
        </Label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ethereum"
          maxLength={100}
          required
        />

        <small className="text-surface-500">{t('crypto.networkNameHelp', { defaultValue: 'Full network name' })}</small>
      </div>

      {/* Symbol */}
      <div className="col-span-12 md:col-span-6">
        <Label htmlFor="symbol">
          {t('crypto.symbol', { defaultValue: 'Symbol' })} <span className="text-danger">*</span>
        </Label>
        <Input
          type="text"
          id="symbol"
          name="symbol"
          value={formData.symbol}
          onChange={handleChange}
          placeholder="ETH"
          maxLength={20}
          pattern="[A-Za-z0-9]+"
          required
          disabled={isEdit}
          className="uppercase"
        />

        <small className="text-surface-500">
          {t('crypto.symbolHelp', { defaultValue: 'Network symbol (e.g., ETH, BSC)' })}
        </small>
      </div>

      {/* Type */}
      <div className="col-span-12 md:col-span-6">
        <Label htmlFor="type">
          {t('crypto.networkType', { defaultValue: 'Network Type' })} <span className="text-danger">*</span>
        </Label>
        <Select id="type" name="type" value={formData.type} onChange={handleChange} required disabled={isEdit}>
          <option value="mainnet">Mainnet</option>
          <option value="testnet">Testnet</option>
          <option value="devnet">Devnet</option>
          <option value="layer2">Layer 2</option>
          <option value="sidechain">Sidechain</option>
        </Select>
        <small className="text-surface-500">
          {t('crypto.networkTypeHelp', { defaultValue: 'Type of blockchain network' })}
        </small>
      </div>

      {/* Chain ID */}
      <div className="col-span-12 md:col-span-6">
        <Label htmlFor="chainId">{t('crypto.chainId', { defaultValue: 'Chain ID' })}</Label>
        <Input
          type="number"
          id="chainId"
          name="chainId"
          value={formData.chainId}
          onChange={handleChange}
          placeholder="1"
          min="1"
        />

        <small className="text-surface-500">
          {t('crypto.chainIdHelp', { defaultValue: 'EVM chain ID (leave empty for non-EVM)' })}
        </small>
      </div>

      {/* Confirmation Blocks */}
      <div className="col-span-12 md:col-span-6">
        <Label htmlFor="confirmationBlocks">
          {t('crypto.confirmationBlocks', { defaultValue: 'Confirmation Blocks' })}{' '}
          <span className="text-danger">*</span>
        </Label>
        <Input
          type="number"
          id="confirmationBlocks"
          name="confirmationBlocks"
          value={formData.confirmationBlocks}
          onChange={handleChange}
          min="1"
          max="1000"
          required
        />

        <small className="text-surface-500">
          {t('crypto.confirmationBlocksHelp', { defaultValue: 'Number of blocks for confirmation' })}
        </small>
      </div>

      {/* RPC URL */}
      <div className="col-span-12">
        <Label htmlFor="rpcUrl">{t('crypto.rpcUrl', { defaultValue: 'RPC URL' })}</Label>
        <Input
          type="url"
          id="rpcUrl"
          name="rpcUrl"
          value={formData.rpcUrl}
          onChange={handleChange}
          placeholder="https://eth.llamarpc.com"
        />

        <small className="text-surface-500">
          {t('crypto.rpcUrlHelp', { defaultValue: 'Blockchain RPC endpoint' })}
        </small>
      </div>

      {/* Explorer URL */}
      <div className="col-span-12">
        <Label htmlFor="explorerUrl">{t('crypto.explorerUrl', { defaultValue: 'Explorer URL' })}</Label>
        <Input
          type="url"
          id="explorerUrl"
          name="explorerUrl"
          value={formData.explorerUrl}
          onChange={handleChange}
          placeholder="https://etherscan.io"
        />

        <small className="text-surface-500">
          {t('crypto.explorerUrlHelp', { defaultValue: 'Block explorer URL' })}
        </small>
      </div>

      {/* API URL */}
      <div className="col-span-12">
        <Label htmlFor="apiUrl">{t('crypto.apiUrl', { defaultValue: 'API URL' })}</Label>
        <Input
          type="url"
          id="apiUrl"
          name="apiUrl"
          value={formData.apiUrl}
          onChange={handleChange}
          placeholder="https://api.etherscan.io/api"
        />

        <small className="text-surface-500">
          {t('crypto.apiUrlHelp', { defaultValue: 'External API endpoint (e.g., Etherscan API)' })}
        </small>
      </div>

      {/* Status */}
      <div className="col-span-12 md:col-span-6">
        <Label htmlFor="status">{t('invoices.statusCol')}</Label>
        <Select id="status" name="status" value={formData.status} onChange={handleChange}>
          <option value="active">{t('admin.active', { defaultValue: 'Active' })}</option>
          <option value="inactive">{t('crypto.inactive', { defaultValue: 'Inactive' })}</option>
          <option value="maintenance">{t('crypto.maintenance', { defaultValue: 'Maintenance' })}</option>
          <option value="deprecated">{t('crypto.deprecated', { defaultValue: 'Deprecated' })}</option>
        </Select>
      </div>

      {/* Is Testnet */}
      <div className="col-span-12">
        <div className="flex items-center gap-2">
          <input
            className="w-4 h-4 rounded border-surface-300 text-primary-600 focus:ring-primary-500"
            type="checkbox"
            id="isTestnet"
            name="isTestnet"
            checked={formData.isTestnet}
            onChange={handleChange}
          />

          <label className="text-sm text-surface-700" htmlFor="isTestnet">
            {t('crypto.isTestnet', { defaultValue: 'Testnet' })}
          </label>
        </div>
        <small className="text-surface-500 ml-4">
          {t('crypto.isTestnetHelp', { defaultValue: 'Check if this is a test network' })}
        </small>
      </div>

      {/* Actions */}
      <div className="col-span-12 pt-3">
        <div className="flex gap-3 justify-between">
          <div className="flex gap-3 ml-auto">
            <Button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="bg-surface-100 text-surface-700 hover:bg-surface-200 shadow-none"
            >
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner role="status" className="w-4 h-4 mr-2" />
                  {t('actions.saving', { defaultValue: 'Saving...' })}
                </>
              ) : (
                <>
                  <i className="bx bx-save mr-2"></i>
                  {isEdit
                    ? t('actions.update', { defaultValue: 'Update' })
                    : t('actions.create', { defaultValue: 'Create' })}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
