'use client'

import { useTranslation } from 'react-i18next'
import CoinImg, { NetworkIcon } from '@/components/CoinImg'

const STYLES = {
  selected: {
    transition: 'all 0.2s ease',
    background: 'color-mix(in srgb, var(--color-primary-600) 15%, transparent)',
    border: '2px solid color-mix(in srgb, var(--color-primary-600) 40%, transparent)',
    boxShadow: '0 4px 16px color-mix(in srgb, var(--color-primary-600) 15%, transparent)',
    transform: 'scale(1.01)',
  },
  unselected: {
    transition: 'all 0.2s ease',
    background: 'rgba(255, 255, 255, 0.6)',
    border: '1px solid color-mix(in srgb, var(--color-primary-600) 10%, transparent)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    transform: 'scale(1)',
  },
  hover: {
    transition: 'all 0.2s ease',
    background: 'color-mix(in srgb, var(--color-primary-600) 4%, transparent)',
    border: '1px solid color-mix(in srgb, var(--color-primary-600) 25%, transparent)',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    transform: 'scale(1)',
  },
  networkBadge: { bottom: -2, right: -2, padding: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
}

const STYLE_SELECTED_CIRCLE = {
  background: 'linear-gradient(135deg, var(--color-primary-600), color-mix(in srgb, var(--color-primary-600), #000 25%))',
  boxShadow: '0 4px 12px color-mix(in srgb, var(--color-primary-600) 40%, transparent)',
}

function CoinNetworkItem({ group, cn, isSelected, onSelect }) {
  const netName = cn.network?.name || ''
  const netSymbol = (cn.network?.symbol || '').toUpperCase()

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg mb-2 cursor-pointer coin-network-item"
      style={isSelected ? STYLES.selected : STYLES.unselected}
      onClick={() => onSelect(cn.id)}
      onMouseEnter={(e) => {
        if (!isSelected) Object.assign(e.currentTarget.style, STYLES.hover)
      }}
      onMouseLeave={(e) => {
        if (!isSelected) Object.assign(e.currentTarget.style, STYLES.unselected)
      }}
    >
      <div className="relative shrink-0">
        <CoinImg symbol={group.symbol} logoUrl={group.logoUrl} size={40} imgClassName="rounded-full" />
        {netSymbol && (
          <div
            className="absolute bg-card rounded-full flex items-center justify-center"
            style={STYLES.networkBadge}
          >
            <NetworkIcon networkSymbol={netSymbol} size={16} />
          </div>
        )}
      </div>

      <div className="grow min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[0.95rem] text-surface-900">{group.symbol}</span>
          {group.isStableCoin ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-white text-[0.6rem] bg-success-500 font-semibold">
              Stable
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-surface-500 text-[0.8rem]">{group.name}</span>
          {netName && (
            <>
              <span className="text-sm text-surface-500">·</span>
              <span className="text-sm text-primary-600 font-semibold text-xs">{netName}</span>
            </>
          )}
        </div>
      </div>

      <div className="shrink-0">
        {isSelected ? (
          <div
            className="flex items-center justify-center rounded-full w-7 h-7"
            style={STYLE_SELECTED_CIRCLE}
          >
            <i className="bx bx-check text-white text-[18px]"></i>
          </div>
        ) : (
          <div className="rounded-full w-7 h-7 border-2 border-surface-200"></div>
        )}
      </div>
    </div>
  )
}

export default function CoinNetworkList({ filteredGroups, selectedCoinId, onSelect }) {
  const { t } = useTranslation()

  if (filteredGroups.length === 0) {
    return (
      <div className="text-center py-4">
        <i className="bx bx-coin text-[48px] text-surface-500"></i>
        <p className="text-surface-500 mt-2 mb-0 text-sm">
          {t('payment.noCoinsFound', { defaultValue: 'No coins available' })}
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {filteredGroups.map((group) => (
        <div key={group.symbol}>
          {group.networks.map((cn) => (
            <CoinNetworkItem
              key={cn.id}
              group={group}
              cn={cn}
              isSelected={selectedCoinId === cn.id}
              onSelect={onSelect}
            />
          ))}
        </div>
      ))}
    </div>
  )
}
