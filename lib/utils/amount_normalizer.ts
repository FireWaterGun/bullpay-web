/**
 * AmountNormalizer - Universal cryptocurrency amount converter
 *
 * Converts between human-readable amounts and raw blockchain units
 * across multiple chains (EVM, Bitcoin, Solana, TRON).
 *
 * Related: CRYPTOCURRENCY_AMOUNT_HANDLING.md
 * Related: MULTI_CHAIN_IMPLEMENTATION_ROADMAP.md
 */

import { BigNumber } from 'bignumber.js'

/**
 * Supported blockchain families
 */
export type SupportedChain = 'ETH' | 'BSC' | 'POLYGON' | 'BTC' | 'SOL' | 'TRX'

/**
 * Chain-specific decimal constants
 */
export const CHAIN_DECIMALS = {
  ETH: 18, // Wei
  BSC: 18, // Wei (BNB)
  POLYGON: 18, // Wei (MATIC)
  BTC: 8, // Satoshi
  SOL: 9, // Lamports
  TRX: 6, // Sun
} as const

/**
 * Universal Amount Normalizer
 *
 * Handles conversion between human-readable amounts and raw blockchain units
 * using chain-specific libraries for maximum compatibility.
 */
export class AmountNormalizer {
  /**
   * Convert human-readable amount to raw blockchain units
   *
   * @param amount - Human-readable amount (e.g., "1.5")
   * @param chain - Blockchain family
   * @param decimals - Decimal places for this token
   * @returns Raw units as string (e.g., "1500000000000000000")
   *
   * @example
   * AmountNormalizer.toRaw("1.5", "ETH", 18)
   * // Returns: "1500000000000000000" (wei)
   *
   * @example
   * AmountNormalizer.toRaw("0.001", "BTC", 8)
   * // Returns: "100000" (satoshi)
   */
  static toRaw(amount: string, chain: SupportedChain, decimals: number): string {
    // Validate inputs
    if (!amount || typeof amount !== 'string') {
      throw new Error(`Invalid amount: ${amount}`)
    }

    if (decimals < 0 || decimals > 18) {
      throw new Error(`Invalid decimals: ${decimals} (must be 0-18)`)
    }

    const trimmedAmount = amount.trim()

    // Validate amount format
    if (!/^-?\d+(\.\d+)?$/.test(trimmedAmount)) {
      throw new Error(`Invalid amount format: ${amount}`)
    }

    try {
      // Use BigNumber for all chains — avoids importing ethers (~300KB)
      const value = new BigNumber(trimmedAmount)
      const multiplier = new BigNumber(10).pow(decimals)
      return value.multipliedBy(multiplier).integerValue().toString()
    } catch (error: any) {
      throw new Error(
        `Failed to convert amount to raw units: ${error.message} (amount=${amount}, chain=${chain}, decimals=${decimals})`
      )
    }
  }

  /**
   * Convert raw blockchain units to human-readable amount
   *
   * @param raw - Raw units as string
   * @param chain - Blockchain family
   * @param decimals - Decimal places for this token
   * @returns Human-readable amount (e.g., "1.5")
   *
   * @example
   * AmountNormalizer.fromRaw("1500000000000000000", "ETH", 18)
   * // Returns: "1.5"
   *
   * @example
   * AmountNormalizer.fromRaw("100000", "BTC", 8)
   * // Returns: "0.001"
   */
  static fromRaw(raw: string, chain: SupportedChain, decimals: number): string {
    // Validate inputs
    if (!raw || typeof raw !== 'string') {
      throw new Error(`Invalid raw units: ${raw}`)
    }

    if (decimals < 0 || decimals > 18) {
      throw new Error(`Invalid decimals: ${decimals} (must be 0-18)`)
    }

    const trimmedRaw = raw.trim()

    // Validate raw format (must be integer)
    if (!/^-?\d+$/.test(trimmedRaw)) {
      throw new Error(`Invalid raw units format: ${raw} (must be integer)`)
    }

    try {
      // Use BigNumber for all chains — avoids importing ethers (~300KB)
      const value = new BigNumber(trimmedRaw)
      const divisor = new BigNumber(10).pow(decimals)
      const result = value.dividedBy(divisor)
      // Use toFixed(decimals) to avoid scientific notation and trim trailing zeros
      return result.toFixed(decimals).replace(/\.?0+$/, '')
    } catch (error: any) {
      throw new Error(
        `Failed to convert raw units to amount: ${error.message} (raw=${raw}, chain=${chain}, decimals=${decimals})`
      )
    }
  }

  /**
   * Auto-detect blockchain family from coin and network symbols
   *
   * @param coinSymbol - Coin symbol (e.g., "ETH", "BTC", "USDT")
   * @param networkSymbol - Network symbol (e.g., "ETHEREUM", "BITCOIN", "POLYGON")
   * @returns Detected blockchain family
   *
   * @example
   * AmountNormalizer.detectChain("BTC", "BTC")
   * // Returns: "BTC"
   *
   * @example
   * AmountNormalizer.detectChain("USDT", "POLYGON")
   * // Returns: "POLYGON"
   */
  static detectChain(coinSymbol: string, networkSymbol: string): SupportedChain {
    const coin = coinSymbol.toUpperCase()
    const network = networkSymbol.toUpperCase()

    // Bitcoin - highest priority for native coin
    if (coin === 'BTC' || network === 'BTC' || network === 'BITCOIN') {
      return 'BTC'
    }

    // Solana
    if (coin === 'SOL' || network === 'SOL' || network === 'SOLANA') {
      return 'SOL'
    }

    // TRON
    if (coin === 'TRX' || network === 'TRX' || network === 'TRON') {
      return 'TRX'
    }

    // BSC (Binance Smart Chain)
    if (
      coin === 'BNB' ||
      network === 'BSC' ||
      network === 'BNB' ||
      network === 'BINANCE' ||
      network === 'BINANCE_SMART_CHAIN'
    ) {
      return 'BSC'
    }

    // Polygon
    if (
      coin === 'MATIC' ||
      coin === 'POL' ||
      network === 'POLYGON' ||
      network === 'MATIC' ||
      network === 'POL'
    ) {
      return 'POLYGON'
    }

    // Default to Ethereum for:
    // 1. Native ETH
    // 2. All ERC-20 tokens (USDT, USDC, etc.)
    // 3. Other EVM-compatible networks
    return 'ETH'
  }

  /**
   * Get recommended decimals for a chain
   *
   * @param chain - Blockchain family
   * @returns Standard decimals for native token
   *
   * @example
   * AmountNormalizer.getChainDecimals("ETH")
   * // Returns: 18
   */
  static getChainDecimals(chain: SupportedChain): number {
    return CHAIN_DECIMALS[chain]
  }

  /**
   * Validate amount format
   *
   * @param amount - Amount to validate
   * @returns True if valid format
   */
  static isValidAmount(amount: string): boolean {
    if (!amount || typeof amount !== 'string') return false
    return /^-?\d+(\.\d+)?$/.test(amount.trim())
  }

  /**
   * Validate raw units format
   *
   * @param raw - Raw units to validate
   * @returns True if valid format (integer only)
   */
  static isValidRaw(raw: string): boolean {
    if (!raw || typeof raw !== 'string') return false
    return /^-?\d+$/.test(raw.trim())
  }

  // ==================== ARITHMETIC OPERATIONS ====================

  /**
   * Add two amounts
   *
   * @param a - First amount
   * @param b - Second amount
   * @param chain - Blockchain family
   * @param decimals - Decimal places
   * @returns Sum as string
   *
   * @example
   * AmountNormalizer.add("1.5", "2.3", "ETH", 18)
   * // Returns: "3.8"
   */
  static add(a: string, b: string, chain: SupportedChain, decimals: number): string {
    const aRaw = BigInt(this.toRaw(a, chain, decimals))
    const bRaw = BigInt(this.toRaw(b, chain, decimals))
    const sum = aRaw + bRaw
    return this.fromRaw(sum.toString(), chain, decimals)
  }

  /**
   * Subtract two amounts
   *
   * @param a - First amount
   * @param b - Second amount
   * @param chain - Blockchain family
   * @param decimals - Decimal places
   * @returns Difference as string
   *
   * @example
   * AmountNormalizer.subtract("5.0", "1.2", "ETH", 18)
   * // Returns: "3.8"
   */
  static subtract(a: string, b: string, chain: SupportedChain, decimals: number): string {
    const aRaw = BigInt(this.toRaw(a, chain, decimals))
    const bRaw = BigInt(this.toRaw(b, chain, decimals))
    const difference = aRaw - bRaw
    return this.fromRaw(difference.toString(), chain, decimals)
  }

  /**
   * Compare two amounts
   *
   * @param a - First amount
   * @param b - Second amount
   * @param chain - Blockchain family
   * @param decimals - Decimal places
   * @returns -1 if a < b, 0 if a == b, 1 if a > b
   *
   * @example
   * AmountNormalizer.compare("1.5", "2.0", "ETH", 18)
   * // Returns: -1
   */
  static compare(a: string, b: string, chain: SupportedChain, decimals: number): -1 | 0 | 1 {
    const aRaw = BigInt(this.toRaw(a, chain, decimals))
    const bRaw = BigInt(this.toRaw(b, chain, decimals))

    if (aRaw < bRaw) return -1
    if (aRaw > bRaw) return 1
    return 0
  }

  /**
   * Multiply amount by a number
   *
   * @param amount - Amount to multiply
   * @param multiplier - Multiplier (integer or decimal string)
   * @param chain - Blockchain family
   * @param decimals - Decimal places
   * @returns Product as string
   *
   * @example
   * AmountNormalizer.multiply("1.5", "2", "ETH", 18)
   * // Returns: "3.0"
   */
  static multiply(
    amount: string,
    multiplier: number | string,
    chain: SupportedChain,
    decimals: number
  ): string {
    const amountRaw = BigInt(this.toRaw(amount, chain, decimals))

    // Convert multiplier to BigInt with fixed precision (6 decimals)
    const mult = typeof multiplier === 'string' ? Number.parseFloat(multiplier) : multiplier
    const multScaled = BigInt(Math.round(mult * 1e6))
    const result = (amountRaw * multScaled) / 1_000_000n

    return this.fromRaw(result.toString(), chain, decimals)
  }

  /**
   * Divide amount by a number
   *
   * @param amount - Amount to divide
   * @param divisor - Divisor (must be positive integer)
   * @param chain - Blockchain family
   * @param decimals - Decimal places
   * @returns Quotient as string
   *
   * @example
   * AmountNormalizer.divide("10.0", 4, "ETH", 18)
   * // Returns: "2.5"
   */
  static divide(amount: string, divisor: number, chain: SupportedChain, decimals: number): string {
    if (!Number.isInteger(divisor) || divisor <= 0) {
      throw new Error(`Divisor must be positive integer, got ${divisor}`)
    }

    const amountRaw = BigInt(this.toRaw(amount, chain, decimals))
    const result = amountRaw / BigInt(divisor)

    return this.fromRaw(result.toString(), chain, decimals)
  }

  /**
   * Multiply two decimal amounts (for exchange rate calculations)
   *
   * @param amountA - First amount
   * @param amountB - Second amount (e.g., exchange rate)
   * @param chain - Blockchain family
   * @param decimals - Decimal places for result
   * @returns Product as string
   *
   * @example
   * AmountNormalizer.multiplyDecimals("100", "0.000025", "ETH", 18)
   * // Returns: "0.0025"
   */
  static multiplyDecimals(
    amountA: string,
    amountB: string,
    chain: SupportedChain,
    decimals: number
  ): string {
    const aRaw = BigInt(this.toRaw(amountA, chain, decimals))
    const bRaw = BigInt(this.toRaw(amountB, chain, decimals))

    // Multiply and normalize back
    const product = aRaw * bRaw
    const divisor = BigInt(10) ** BigInt(decimals)

    return this.fromRaw((product / divisor).toString(), chain, decimals)
  }

  // ==================== AGGREGATION OPERATIONS ====================

  /**
   * Sum multiple amounts
   *
   * @param amounts - Array of amounts
   * @param chain - Blockchain family
   * @param decimals - Decimal places
   * @returns Sum as string
   *
   * @example
   * AmountNormalizer.sum(["1.5", "2.0", "3.5"], "ETH", 18)
   * // Returns: "7.0"
   */
  static sum(amounts: string[], chain: SupportedChain, decimals: number): string {
    const total = amounts.reduce((sum, amount) => {
      const raw = BigInt(this.toRaw(amount, chain, decimals))
      return sum + raw
    }, 0n)

    return this.fromRaw(total.toString(), chain, decimals)
  }

  /**
   * Find maximum amount
   *
   * @param amounts - Array of amounts
   * @param chain - Blockchain family
   * @param decimals - Decimal places
   * @returns Maximum amount as string
   *
   * @example
   * AmountNormalizer.max(["1.5", "3.0", "2.0"], "ETH", 18)
   * // Returns: "3.0"
   */
  static max(amounts: string[], chain: SupportedChain, decimals: number): string {
    if (amounts.length === 0) {
      throw new Error('Cannot find max of empty array')
    }

    const rawAmounts = amounts.map((a) => BigInt(this.toRaw(a, chain, decimals)))
    const maxRaw = rawAmounts.reduce((max, curr) => (curr > max ? curr : max))

    return this.fromRaw(maxRaw.toString(), chain, decimals)
  }

  /**
   * Find minimum amount
   *
   * @param amounts - Array of amounts
   * @param chain - Blockchain family
   * @param decimals - Decimal places
   * @returns Minimum amount as string
   *
   * @example
   * AmountNormalizer.min(["1.5", "3.0", "2.0"], "ETH", 18)
   * // Returns: "1.5"
   */
  static min(amounts: string[], chain: SupportedChain, decimals: number): string {
    if (amounts.length === 0) {
      throw new Error('Cannot find min of empty array')
    }

    const rawAmounts = amounts.map((a) => BigInt(this.toRaw(a, chain, decimals)))
    const minRaw = rawAmounts.reduce((min, curr) => (curr < min ? curr : min))

    return this.fromRaw(minRaw.toString(), chain, decimals)
  }

  // ==================== VALIDATION OPERATIONS ====================

  /**
   * Check if amount is zero
   *
   * @param amount - Amount to check
   * @param chain - Blockchain family
   * @param decimals - Decimal places
   * @returns True if amount is zero
   *
   * @example
   * AmountNormalizer.isZero("0.0", "ETH", 18)
   * // Returns: true
   */
  static isZero(amount: string, chain: SupportedChain, decimals: number): boolean {
    const raw = BigInt(this.toRaw(amount, chain, decimals))
    return raw === 0n
  }

  /**
   * Check if amount is positive
   *
   * @param amount - Amount to check
   * @param chain - Blockchain family
   * @param decimals - Decimal places
   * @returns True if amount is positive (> 0)
   *
   * @example
   * AmountNormalizer.isPositive("1.5", "ETH", 18)
   * // Returns: true
   */
  static isPositive(amount: string, chain: SupportedChain, decimals: number): boolean {
    const raw = BigInt(this.toRaw(amount, chain, decimals))
    return raw > 0n
  }

  /**
   * Check if amount is negative
   *
   * @param amount - Amount to check
   * @param chain - Blockchain family
   * @param decimals - Decimal places
   * @returns True if amount is negative (< 0)
   *
   * @example
   * AmountNormalizer.isNegative("-1.5", "ETH", 18)
   * // Returns: true
   */
  static isNegative(amount: string, chain: SupportedChain, decimals: number): boolean {
    const raw = BigInt(this.toRaw(amount, chain, decimals))
    return raw < 0n
  }

  // ==================== NORMALIZATION OPERATIONS ====================

  /**
   * Normalize amount to specific decimal places
   * (Truncate excess decimals and trim trailing zeros)
   *
   * @param amount - Amount to normalize
   * @param chain - Blockchain family
   * @param decimals - Target decimal places
   * @returns Normalized amount
   *
   * @example
   * AmountNormalizer.normalize("1.500000", "ETH", 18)
   * // Returns: "1.5"
   *
   * @example
   * AmountNormalizer.normalize("1.123456789", "BTC", 8)
   * // Returns: "1.12345678"
   */
  static normalize(amount: string, chain: SupportedChain, decimals: number): string {
    // Convert to raw and back to auto-trim trailing zeros
    const raw = this.toRaw(amount, chain, decimals)
    return this.fromRaw(raw, chain, decimals)
  }

  /**
   * Get decimals for a coin on a specific network
   * (Integrates decimal_normalizer logic)
   *
   * @param coinSymbol - Coin symbol (e.g., "USDT", "ETH")
   * @param networkSymbol - Network symbol (e.g., "POLYGON", "ETHEREUM")
   * @returns Number of decimals
   *
   * @example
   * AmountNormalizer.getDecimals("USDT", "POLYGON")
   * // Returns: 6
   */
  static getDecimals(coinSymbol: string, networkSymbol: string): number {
    const coin = coinSymbol.toUpperCase()
    const network = networkSymbol.toUpperCase()

    // Token-specific decimals (highest priority)
    const TOKEN_DECIMALS: Record<string, number> = {
      USDT: 6,
      USDC: 6,
      BUSD: 18,
      DAI: 18,
      WETH: 18,
      WBTC: 8,
      WMATIC: 18,
      WBNB: 18,
    }

    if (coin in TOKEN_DECIMALS) {
      return TOKEN_DECIMALS[coin]
    }

    // Network native token (e.g., ETH on Ethereum)
    if (coin === network && network in CHAIN_DECIMALS) {
      return CHAIN_DECIMALS[network as SupportedChain]
    }

    // Detect chain and return decimals
    const detectedChain = this.detectChain(coin, network)
    return CHAIN_DECIMALS[detectedChain]
  }

  // ==================== SIMPLE CONVERSION (No Chain Detection) ====================
  // For Model getters and contexts where chain is unknown

  /**
   * Convert raw units to decimal string (simple BigInt conversion)
   * Does NOT use external libraries - pure BigInt math
   * Use this for Model getters where chain context is unavailable
   *
   * @param raw - Raw units as bigint or string
   * @param decimals - Decimal places
   * @returns Decimal string with trailing zeros trimmed
   *
   * @example
   * AmountNormalizer.fromRawSimple(1500000000000000000n, 18)
   * // Returns: "1.5"
   */
  static fromRawSimple(raw: bigint | string, decimals: number): string {
    const rawBigInt = typeof raw === 'string' ? BigInt(raw) : raw

    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 78) {
      throw new Error(`Invalid decimals: ${decimals}`)
    }

    const negative = rawBigInt < 0n
    const absRaw = negative ? -rawBigInt : rawBigInt

    // Convert to string and pad
    const rawString = absRaw.toString().padStart(decimals + 1, '0')

    // Split into integer and fractional parts
    const integerPart = rawString.slice(0, -decimals) || '0'
    const fractionalPart = rawString.slice(-decimals)

    // Trim trailing zeros
    const trimmedFraction = fractionalPart.replace(/0+$/, '')

    // Build result
    const result = trimmedFraction ? `${integerPart}.${trimmedFraction}` : integerPart

    return negative ? `-${result}` : result
  }

  /**
   * Convert decimal string to raw units (simple BigInt conversion)
   * Does NOT use external libraries - pure BigInt math
   * Use this for Model operations where chain context is unavailable
   *
   * @param amount - Decimal amount string
   * @param decimals - Decimal places
   * @returns Raw units as string
   *
   * @example
   * AmountNormalizer.toRawSimple("1.5", 18)
   * // Returns: "1500000000000000000"
   */
  static toRawSimple(amount: string, decimals: number): string {
    if (!amount || typeof amount !== 'string') {
      throw new Error(`Invalid amount: ${amount}`)
    }

    if (!Number.isInteger(decimals) || decimals < 0 || decimals > 78) {
      throw new Error(`Invalid decimals: ${decimals}`)
    }

    const trimmed = amount.trim()

    // Validate format
    if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
      throw new Error(`Invalid number format: ${amount}`)
    }

    // Split into parts
    const [integerPart, fractionalPart = ''] = trimmed.split('.')

    // Check precision
    if (fractionalPart.length > decimals) {
      throw new Error(
        `Amount ${amount} exceeds ${decimals} decimal places (has ${fractionalPart.length})`
      )
    }

    // Pad fractional part
    const paddedFraction = fractionalPart.padEnd(decimals, '0')

    // Combine
    const rawString = integerPart + paddedFraction

    return rawString
  }

  // ==================== BIGINT CONVERSION (Recommended for Arithmetic) ====================

  /**
   * Convert decimal string to raw BigInt (for arithmetic operations)
   * Recommended for calculations - no need to wrap with BigInt()
   *
   * @param amount - Decimal amount string
   * @param decimals - Decimal places
   * @returns Raw units as bigint (ready for arithmetic)
   *
   * @example
   * const raw = AmountNormalizer.toRawBigInt("1.5", 18)
   * // Returns: 1500000000000000000n (bigint, not string)
   *
   * // Use directly in calculations
   * const total = raw + AmountNormalizer.toRawBigInt("2.5", 18)
   * // Returns: 4000000000000000000n
   */
  static toRawBigInt(amount: string, decimals: number): bigint {
    return BigInt(this.toRawSimple(amount, decimals))
  }

  /**
   * Convert raw BigInt to decimal string
   * Companion method for toRawBigInt()
   *
   * @param raw - Raw units as bigint
   * @param decimals - Decimal places
   * @returns Decimal string with trailing zeros trimmed
   *
   * @example
   * const amount = AmountNormalizer.fromRawBigInt(1500000000000000000n, 18)
   * // Returns: "1.5"
   */
  static fromRawBigInt(raw: bigint, decimals: number): string {
    return this.fromRawSimple(raw, decimals)
  }

  /**
   * Convert raw string (from database) to BigInt
   * Use when you already have raw units as string and need BigInt for arithmetic
   *
   * @param rawString - Raw amount as string (e.g., "1500000000000000000")
   * @returns BigInt representation
   *
   * @example
   * const balanceRaw = "1500000000000000000" // from database
   * const balance = AmountNormalizer.rawStringToBigInt(balanceRaw)
   * // Returns: 1500000000000000000n
   *
   * const total = balance + AmountNormalizer.toRawBigInt("2.5", 18)
   * // Returns: 4000000000000000000n
   */
  static rawStringToBigInt(rawString: string): bigint {
    return BigInt(rawString)
  }

  /**
   * Convert number to BigInt
   * Use for literal numbers in calculations (gas limits, multipliers, etc.)
   *
   * @param value - Number to convert
   * @returns BigInt representation
   *
   * @example
   * const gasLimit = AmountNormalizer.numberToBigInt(21000)
   * // Returns: 21000n
   *
   * const multiplier = AmountNormalizer.numberToBigInt(100)
   * const result = (priceWei * multiplier) / 100n
   */
  static numberToBigInt(value: number): bigint {
    return BigInt(value)
  }

  /**
   * Multiply two BigInt values (for gas calculations, etc.)
   *
   * @param a - First BigInt value
   * @param b - Second BigInt value
   * @returns Result of multiplication
   *
   * @example
   * const gasUsed = AmountNormalizer.rawStringToBigInt("21000")
   * const gasPrice = AmountNormalizer.rawStringToBigInt("50000000000")
   * const fee = AmountNormalizer.multiplyBigInt(gasUsed, gasPrice)
   * // Returns: 1050000000000000n (gas fee in wei)
   */
  static multiplyBigInt(a: bigint, b: bigint): bigint {
    return a * b
  }

  // ==================== LEGACY COMPATIBILITY (from decimal_units.ts) ====================

  /**
   * Convert decimal string to BigInt units (legacy toUnits replacement)
   * Identical to toRawBigInt() but maintains decimal_units naming for compatibility
   *
   * @param amount - Decimal amount string
   * @param decimals - Decimal places
   * @returns BigInt units
   *
   * @example
   * AmountNormalizer.toUnits("1.5", 18)
   * // Returns: 1500000000000000000n
   */
  static toUnits(amount: string, decimals: number): bigint {
    return this.toRawBigInt(amount, decimals)
  }

  /**
   * Convert BigInt units to decimal string (legacy fromUnits replacement)
   * Identical to fromRawBigInt() but maintains decimal_units naming for compatibility
   *
   * @param units - BigInt units
   * @param decimals - Decimal places
   * @returns Decimal string
   *
   * @example
   * AmountNormalizer.fromUnits(1500000000000000000n, 18)
   * // Returns: "1.5"
   */
  static fromUnits(units: bigint, decimals: number): string {
    return this.fromRawBigInt(units, decimals)
  }

  /**
   * Multiply and divide BigInt values (a * num / den)
   * Used for percentage calculations and fee computations
   *
   * @param a - Base amount
   * @param num - Numerator
   * @param den - Denominator
   * @returns floor(a * num / den)
   *
   * @example
   * AmountNormalizer.mulDiv(1000n, 15n, 100n)
   * // Returns: 150n (1000 * 15 / 100 = 150)
   */
  static mulDiv(a: bigint, num: bigint, den: bigint): bigint {
    return (a * num) / den
  }

  /**
   * Ceiling division (round up)
   * Returns ceil(a / b)
   *
   * @param a - Dividend
   * @param b - Divisor
   * @returns Ceiling of a / b
   *
   * @example
   * AmountNormalizer.ceilDiv(10n, 3n)
   * // Returns: 4n (ceil(10/3) = 4)
   */
  static ceilDiv(a: bigint, b: bigint): bigint {
    return (a + b - 1n) / b
  }

  /**
   * Convert percentage to fraction
   * Note: percent is given as percent, not fraction (0.1 means 0.1%)
   *
   * @param percent - Percentage value (e.g., 0.15 for 0.15%)
   * @returns { num, den } - Numerator and denominator
   *
   * @example
   * AmountNormalizer.percentToFraction(0.15)
   * // Returns: { num: 15n, den: 10000n }
   * // Because 0.15% = 15/10000
   */
  static percentToFraction(percent: number): { num: bigint; den: bigint } {
    const s = String(percent)
    const dot = s.indexOf('.')
    const dp = dot === -1 ? 0 : s.length - dot - 1
    const scaled = Math.round(percent * Math.pow(10, dp))
    const num = BigInt(scaled)
    const den = BigInt(100 * Math.pow(10, dp))
    return { num, den }
  }

  /**
   * Convert number to decimal string, avoiding scientific notation
   *
   * @param value - Number to convert
   * @param maxDecimals - Maximum decimal places (default: 18)
   * @returns String representation
   *
   * @example
   * AmountNormalizer.numberToDecimalString(0.00000001)
   * // Returns: "0.00000001" (not "1e-8")
   */
  static numberToDecimalString(value: number, maxDecimals: number = 18): string {
    if (value === 0) return '0'
    const fixed = value.toFixed(maxDecimals)
    return fixed.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '')
  }

  /**
   * Convert number or string to safe decimal string format
   *
   * @param value - Number or string to convert
   * @param defaultValue - Default value if input is undefined/null
   * @returns String representation
   *
   * @example
   * AmountNormalizer.toDecimalString(0.00000001)
   * // Returns: "0.00000001"
   */
  static toDecimalString(value: number | string | undefined, defaultValue: string = '0'): string {
    if (value === undefined || value === null) return defaultValue
    if (typeof value === 'string') return value
    return this.numberToDecimalString(value)
  }

  /**
   * Safely normalize a value to decimal string format with validation
   * Returns default value on error (safe wrapper)
   *
   * @param value - Number or string to normalize
   * @param defaultValue - Default value if validation fails (default: '0')
   * @param options - Validation options
   * @returns Validated decimal string or default value
   *
   * @example
   * AmountNormalizer.normalizeDecimalSafe(0.0005, '0', { min: 0 })
   * // Returns: "0.0005"
   *
   * @example
   * AmountNormalizer.normalizeDecimalSafe("invalid", '0', { min: 0 })
   * // Returns: "0" (default)
   */
  static normalizeDecimalSafe(
    value: number | string | undefined | null,
    defaultValue: string = '0',
    options?: {
      min?: number
      max?: number
      allowZero?: boolean
      maxDecimals?: number
    }
  ): string {
    try {
      // Handle null/undefined
      if (value === undefined || value === null) {
        if (options?.allowZero) return '0'
        return defaultValue
      }

      let normalized: string

      if (typeof value === 'number') {
        // Validate number
        if (!Number.isFinite(value)) {
          return defaultValue
        }

        // Check for scientific notation risk
        if (value !== 0 && Math.abs(value) < 1e-10) {
          return defaultValue
        }

        if (Math.abs(value) >= 1e15) {
          return defaultValue
        }

        normalized = value.toString()

        // Check if toString produced scientific notation
        if (normalized.includes('e')) {
          return defaultValue
        }
      } else if (typeof value === 'string') {
        // Validate string format
        const trimmed = value.trim()

        // Check for scientific notation in string
        if (/e/i.test(trimmed)) {
          return defaultValue
        }

        // Validate decimal format: optional sign, digits, optional decimal point and digits
        if (!/^-?\d+(\.\d+)?$/.test(trimmed)) {
          return defaultValue
        }

        normalized = trimmed
      } else {
        return defaultValue
      }

      // Validate range
      const numValue = Number.parseFloat(normalized)

      if (!options?.allowZero && numValue === 0) {
        return defaultValue
      }

      if (options?.min !== undefined && numValue < options.min) {
        return defaultValue
      }

      if (options?.max !== undefined && numValue > options.max) {
        return defaultValue
      }

      // Validate max decimals
      if (options?.maxDecimals !== undefined) {
        const decimalPart = normalized.split('.')[1]
        if (decimalPart && decimalPart.length > options.maxDecimals) {
          return defaultValue
        }
      }

      return normalized
    } catch {
      return defaultValue
    }
  }
}
