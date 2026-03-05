'use client'

import { useState, useMemo } from 'react'
import { getCoinAssetCandidates } from '@/lib/utils/coinAssets'
import { coinImageExists } from '@/lib/utils/coinImageManifest'

// ---------------------------------------------------------------------------
// Static inline-style constants (hoisted out of render)
// ---------------------------------------------------------------------------

const objectFitCover = { objectFit: 'cover' }

const AVATAR_COLORS = [
  '#7367F0', '#00CFE8', '#28C76F', '#FF9F43',
  '#EA5455', '#9966FF', '#00D4BD',
]

function getAvatarColor(text) {
  const idx = (text || 'C').charCodeAt(0) % AVATAR_COLORS.length
  return AVATAR_COLORS[idx]
}

// ---------------------------------------------------------------------------
// Network-name-to-symbol mapping
// ---------------------------------------------------------------------------

const NETWORK_NAME_MAP = {
  'bnb smart chain': 'bnb',
  bsc: 'bnb',
  optimism: 'op',
  polygon: 'matic',
  ethereum: 'eth',
  arbitrum: 'arb',
  avalanche: 'avax',
  base: 'base',
  solana: 'sol',
  tron: 'trx',
}

export function networkNameToSymbol(name) {
  return NETWORK_NAME_MAP[String(name || '').toLowerCase()] || null
}

// ---------------------------------------------------------------------------
// Network-specific image candidates (looks in /assets/img/networks/ first)
// ---------------------------------------------------------------------------

const NETWORK_ALIASES = {
  eth: ['ethereum'],
  bsc: ['binance', 'bnb'],
  matic: ['polygon'],
  polygon: ['polygon', 'matic'],
  arbitrum: ['arbitrum'],
  optimism: ['optimism'],
  avalanche: ['avalanche', 'avax'],
  fantom: ['fantom', 'ftm'],
  base: ['base'],
  tron: ['tron', 'trx'],
}

function getNetworkAssetCandidates(networkSymbol) {
  const sym = String(networkSymbol || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!sym) return []
  const names = [sym, ...(NETWORK_ALIASES[sym] || [])]
  const exts = ['svg', 'png']
  const byNetworks = names.flatMap((n) => exts.map((ext) => `/assets/img/networks/${n}.${ext}`))
  const byCoinFallback = names.flatMap((n) => exts.map((ext) => `/assets/img/coins/${n}.${ext}`))
  const arr = [...byNetworks, ...byCoinFallback].filter(coinImageExists)
  arr.push('/assets/img/coins/default.svg')
  return Array.from(new Set(arr))
}

// ---------------------------------------------------------------------------
// NetworkIcon — standalone network icon (exported for PaySelect / PaymentV2)
// ---------------------------------------------------------------------------

export function NetworkIcon({ networkSymbol, size = 24 }) {
  const [idx, setIdx] = useState(0)
  const candidates = useMemo(
    () => getNetworkAssetCandidates(networkSymbol),
    [networkSymbol],
  )
  const src = candidates[Math.min(idx, candidates.length - 1)]
  return (
    <img
      src={src}
      alt={networkSymbol}
      width={size}
      height={size}
      className="rounded-full"
      style={objectFitCover}
      onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i))}
    />
  )
}

// ---------------------------------------------------------------------------
// CoinImg — unified coin image with optional network badge & letter fallback
// ---------------------------------------------------------------------------

/**
 * Props:
 *   coin          — coin object with optional `logoUrl` field
 *   symbol        — coin ticker symbol (e.g. "ETH", "BTC")
 *   logoUrl       — explicit logo URL (used by payment pages that don't pass coin obj)
 *   networkSymbol — network ticker (e.g. "MATIC"); shows badge when provided
 *   networkName   — human-readable network name; resolved via networkNameToSymbol
 *   size          — main image pixel size (default 32)
 *   badgeSize     — network badge pixel size (auto-calculated if omitted)
 *   className     — additional CSS class on the wrapper
 *   showFallback  — if true, show a coloured letter avatar when all images fail
 *   imgClassName  — CSS class applied to the main <img> tag (default: none)
 */
export default function CoinImg({
  coin,
  symbol,
  logoUrl,
  networkSymbol,
  networkName,
  size = 32,
  badgeSize: badgeSizeProp,
  className,
  showFallback = false,
  imgClassName,
}) {
  // Resolve network symbol from name when not given directly
  const resolvedNetworkSymbol = networkSymbol || networkNameToSymbol(networkName)

  // ------ Coin image candidates ------
  const resolvedLogoUrl = logoUrl || coin?.logoUrl || null
  const candidatesRaw = useMemo(
    () => getCoinAssetCandidates(symbol, resolvedLogoUrl),
    [symbol, resolvedLogoUrl],
  )
  // When fallback mode is enabled, strip default.svg so we can detect exhaustion
  const candidates = useMemo(
    () => (showFallback ? candidatesRaw.filter((c) => !c.includes('default.svg')) : candidatesRaw),
    [candidatesRaw, showFallback],
  )
  const [idx, setIdx] = useState(0)
  const [coinExhausted, setCoinExhausted] = useState(false)
  const src = candidates[Math.min(idx, candidates.length - 1)]

  const handleCoinError = () => {
    if (idx + 1 < candidates.length) {
      setIdx((i) => i + 1)
    } else if (showFallback) {
      setCoinExhausted(true)
    }
  }

  // ------ Network badge candidates ------
  const networkCandidatesRaw = useMemo(
    () => getCoinAssetCandidates(resolvedNetworkSymbol, null),
    [resolvedNetworkSymbol],
  )
  const networkCandidates = useMemo(
    () => networkCandidatesRaw.filter((c) => !c.includes('default.svg')),
    [networkCandidatesRaw],
  )
  const [netIdx, setNetIdx] = useState(0)
  const [netExhausted, setNetExhausted] = useState(false)
  const netSrc = networkCandidates[Math.min(netIdx, networkCandidates.length - 1)]

  // Decide badge size: explicit prop, or auto based on main size
  const badgeSize = badgeSizeProp || Math.round(size * 0.55)
  const badgePadding = badgeSize <= 16 ? 1 : 2

  // Should the network badge be shown?
  const showBadge =
    resolvedNetworkSymbol &&
    resolvedNetworkSymbol !== symbol &&
    resolvedNetworkSymbol !== symbol?.toLowerCase() &&
    !(symbol === 'POL' && (resolvedNetworkSymbol === 'MATIC' || resolvedNetworkSymbol === 'matic')) &&
    !netExhausted &&
    networkCandidates.length > 0

  // ------ Letter fallback avatar ------
  if (showFallback && (candidates.length === 0 || coinExhausted)) {
    const letter = (symbol || 'C').charAt(0).toUpperCase()
    return (
      <div
        className={`${className} text-white flex items-center justify-center font-bold shrink-0`}
        style={{ width: size, height: size, borderRadius: '8px', backgroundColor: getAvatarColor(symbol || 'C'), fontSize: size * 0.5 }}
      >
        {letter}
      </div>
    )
  }

  // ------ Simple image (no network badge) ------
  if (!showBadge) {
    return (
      <img
        src={src}
        alt={symbol}
        width={size}
        height={size}
        className={imgClassName || className}
        style={objectFitCover}
        onError={handleCoinError}
      />
    )
  }

  // ------ Image with network badge overlay ------
  return (
    <div
      className={`relative${className ? ` ${className}` : ''} shrink-0`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={symbol}
        width={size}
        height={size}
        className={imgClassName}
        style={objectFitCover}
        onError={handleCoinError}
      />
      <div
        className="absolute rounded-full flex items-center justify-center bg-white"
        style={{ bottom: -2, right: -2, width: badgeSize, height: badgeSize, boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: `${badgePadding}px` }}
      >
        <img
          src={netSrc}
          alt={resolvedNetworkSymbol}
          width={badgeSize - badgePadding * 2}
          height={badgeSize - badgePadding * 2}
          className="rounded-full"
          style={objectFitCover}
          onError={() => {
            if (netIdx + 1 < networkCandidates.length) {
              setNetIdx((i) => i + 1)
            } else {
              setNetExhausted(true)
            }
          }}
        />
      </div>
    </div>
  )
}
