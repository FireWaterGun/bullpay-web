/**
 * Shared coin asset image resolution.
 *
 * Consolidates the `getCoinAssetCandidates()` function that was previously
 * duplicated across 35+ view files.
 */

import { coinImageExists } from './coinImageManifest'

const COIN_ALIASES: Record<string, string[]> = {
  btc: ['bitcoin'],
  eth: ['ethereum'],
  doge: ['dogecoin'],
  sol: ['solana'],
  matic: ['polygon'],
  pol: ['polygon'],
  ada: ['cardano'],
  xmr: ['monero'],
  zec: ['zcash'],
  usdt: ['usdterc20', 'tether'],
  usdttrc20: ['usdt', 'tether'],
  usdterc20: ['usdt', 'tether'],
  usdtbsc: ['usdt', 'tether'],
  usdtbep20: ['usdt', 'tether'],
  usdte: ['usdt', 'tether'],
  usdtton: ['usdtton', 'usdt', 'tether'],
  usdc: ['usd-coin'],
  bnb: ['binance'],
  bsc: ['binance'],
  trx: ['tron'],
  arb: ['arbitrum'],
  op: ['optimism'],
  base: ['base'],
  ln: ['lightning', 'btc'],
  lightning: ['btc'],
  segwitbtc: ['segwit', 'btc'],
  manta: ['mantanetwork'],
}

/**
 * Returns an ordered list of candidate image paths for a given coin symbol.
 * Only includes paths for images that actually exist in the manifest,
 * plus any external logoUrl and the default fallback.
 */
export function getCoinAssetCandidates(symbol: string | null | undefined, logoUrl?: string | null): string[] {
  const sym = String(symbol || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')

  const names = [sym, ...(COIN_ALIASES[sym] || [])]

  // Any USDT variant should also try the base "usdt" icon
  if (sym.startsWith('usdt') && !names.includes('usdt')) names.push('usdt')

  const exts = ['svg', 'png']
  const byAssets = names.flatMap((n) => exts.map((ext) => `/assets/img/coins/${n}.${ext}`)).filter(coinImageExists)

  const candidates = [...byAssets, ...(logoUrl ? [logoUrl] : []), '/assets/img/coins/default.svg']

  return Array.from(new Set(candidates))
}
