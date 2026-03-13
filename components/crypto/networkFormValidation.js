const VALID_STATUSES = new Set(['active', 'inactive', 'maintenance', 'deprecated'])

/**
 * Validates the network form data and returns the cleaned payload.
 * Throws an Error with a descriptive message if validation fails.
 *
 * @param {object} formData - The form state object
 * @param {boolean} isEdit - Whether this is an edit (update) vs create
 * @returns {object} The validated and cleaned payload for the API
 */
export function validateAndBuildPayload(formData, isEdit) {
  // Required fields (create mode only)
  if (!isEdit) {
    if (!formData.name || formData.name.trim().length === 0) {
      throw new Error('Name is required')
    }
    if (formData.name.length > 100) {
      throw new Error('Name must be max 100 characters')
    }
    if (!formData.symbol || formData.symbol.trim().length === 0) {
      throw new Error('Symbol is required')
    }
    if (formData.symbol.length > 10) {
      throw new Error('Symbol must be max 10 characters')
    }
    if (!formData.type || formData.type.trim().length === 0) {
      throw new Error('Network Type is required')
    }
  }

  // Type validation (for both create and update)
  const validTypes = ['mainnet', 'testnet', 'devnet', 'layer2', 'sidechain']
  if (formData.type && !validTypes.includes(formData.type)) {
    throw new Error('Network Type must be one of: mainnet, testnet, devnet, layer2, sidechain')
  }

  // Chain ID - must be positive integer if provided
  if (formData.chainId !== '' && formData.chainId !== null && formData.chainId !== undefined) {
    const chainIdNum = parseInt(formData.chainId)
    if (isNaN(chainIdNum) || chainIdNum <= 0) {
      throw new Error('Chain ID must be a positive integer')
    }
  }

  // Confirmation Blocks - must be >= 0
  if (formData.confirmationBlocks !== '' && formData.confirmationBlocks !== null) {
    const blocks = parseInt(formData.confirmationBlocks)
    if (isNaN(blocks) || blocks < 0) {
      throw new Error('Confirmation blocks must be >= 0')
    }
  }

  // URL validations
  if (formData.rpcUrl && formData.rpcUrl.trim()) {
    try {
      new URL(formData.rpcUrl)
    } catch {
      throw new Error('RPC URL must be a valid URL')
    }
  }
  if (formData.explorerUrl && formData.explorerUrl.trim()) {
    try {
      new URL(formData.explorerUrl)
    } catch {
      throw new Error('Explorer URL must be a valid URL')
    }
  }
  if (formData.apiUrl && formData.apiUrl.trim()) {
    try {
      new URL(formData.apiUrl)
    } catch {
      throw new Error('API URL must be a valid URL')
    }
  }

  // Status validation
  if (formData.status && !VALID_STATUSES.has(formData.status)) {
    throw new Error('Status must be active, inactive, maintenance, or deprecated')
  }

  // Build cleaned payload
  return {
    name: formData.name.trim(),
    symbol: formData.symbol.trim().toUpperCase(),
    type: formData.type || 'mainnet',
    chainId: formData.chainId ? parseInt(formData.chainId) : null,
    rpcUrl: formData.rpcUrl?.trim() || undefined,
    explorerUrl: formData.explorerUrl?.trim() || undefined,
    apiUrl: formData.apiUrl?.trim() || undefined,
    isTestnet: formData.isTestnet,
    confirmationBlocks:
      formData.confirmationBlocks !== '' &&
      formData.confirmationBlocks !== null &&
      formData.confirmationBlocks !== undefined
        ? parseInt(formData.confirmationBlocks)
        : 1,
    status: formData.status || 'active',
  }
}
