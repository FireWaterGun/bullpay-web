import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getPublicInvoice } from '../../api/invoices'
import { listCoins } from '../../api/coins'

import CoinNetworkList from './CoinNetworkList'

export default function PaySelect() {
  const { t } = useTranslation()
  const { code } = useParams()
  const navigate = useNavigate()

  const [invoice, setInvoice] = useState(null)
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedCoinId, setSelectedCoinId] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const year = new Date().getFullYear()

  useEffect(() => {
    if (!code) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError('')
      try {
        const [invoiceRes, coinList] = await Promise.all([
          getPublicInvoice(code).catch(() => null),
          listCoins().catch(() => []),
        ])
        if (cancelled) return
        if (invoiceRes?.invoice) {
          setInvoice(invoiceRes.invoice)
        }
        // Filter only active and visible coins
        const enabled = (coinList || []).filter(c => c.isActive && c.isVisible && c.status === 'active')
        setCoins(enabled)
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [code])

  const STABLECOINS = ['USDT', 'USDC', 'DAI', 'BUSD', 'TUSD', 'FDUSD']

  // Group coins by symbol
  const coinGroups = useMemo(() => {
    const map = new Map()
    coins.forEach(cn => {
      const sym = cn.coin?.symbol || 'Unknown'
      if (!map.has(sym)) {
        map.set(sym, {
          symbol: sym,
          name: cn.coin?.name || sym,
          logoUrl: cn.coin?.logoUrl,
          type: cn.coin?.type || 'token',
          isStableCoin: STABLECOINS.includes(sym.toUpperCase()),
          networks: [],
        })
      }
      map.get(sym).networks.push(cn)
    })
    // Sort: stablecoins first, then alphabetical
    return Array.from(map.values()).sort((a, b) => {
      if (a.isStableCoin && !b.isStableCoin) return -1
      if (!a.isStableCoin && b.isStableCoin) return 1
      return a.symbol.localeCompare(b.symbol)
    })
  }, [coins])

  // Filtered by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return coinGroups
    const q = searchQuery.toLowerCase()
    return coinGroups.filter(g =>
      g.symbol.toLowerCase().includes(q) ||
      g.name.toLowerCase().includes(q) ||
      g.networks.some(n =>
        (n.network?.name || '').toLowerCase().includes(q) ||
        (n.network?.symbol || '').toLowerCase().includes(q)
      )
    )
  }, [coinGroups, searchQuery])

  const handleSelect = (coinNetworkId) => {
    setSelectedCoinId(coinNetworkId)
    // TODO: Navigate or call API to select this coin for payment
    // For now just highlight
  }

  const handleConfirm = () => {
    if (!selectedCoinId) return
    // Navigate to payment page with the selected coin
    navigate(`/pay/${code}?cn=${selectedCoinId}`)
  }

  const invoiceAmount = invoice?.amount || invoice?.requestedAmount
  const invoiceCurrency = invoice?.fiatCurrency || invoice?.currency || 'USD'
  const invoiceDesc = invoice?.description

  return (
    <div className="min-vh-100 position-relative overflow-hidden d-flex flex-column" style={{
      background: 'linear-gradient(135deg, var(--bs-body-bg) 0%, var(--bs-tertiary-bg) 100%)'
    }}>
      {/* Animated Gradient Background */}
      <div className="position-absolute w-100 h-100" style={{ zIndex: 0 }}>
        <div className="position-absolute" style={{
          width: '150%', height: '150%', top: '-25%', left: '-25%',
          background: 'radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.08) 0%, transparent 50%), radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)',
          animation: 'gradientShift 15s ease infinite',
          filter: 'blur(60px)'
        }}></div>
        <div className="position-absolute rounded-circle" style={{
          width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)',
          top: '10%', right: '15%',
          filter: 'blur(40px)',
          animation: 'float 20s ease-in-out infinite'
        }}></div>
        <div className="position-absolute rounded-circle" style={{
          width: 250, height: 250,
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, transparent 70%)',
          bottom: '15%', left: '10%',
          filter: 'blur(50px)',
          animation: 'float 25s ease-in-out infinite reverse'
        }}></div>
      </div>

      {/* Header */}
      <div className="position-relative" style={{ zIndex: 1 }}>
        <div className="container py-3">
          <div className="d-flex justify-content-center align-items-center gap-3">
            <div className="position-relative">
              <div className="position-absolute w-100 h-100 rounded-circle" style={{
                background: 'linear-gradient(135deg, var(--bs-primary), var(--bs-info))',
                filter: 'blur(20px)', opacity: 0.6,
                animation: 'pulse 3s ease-in-out infinite'
              }}></div>
              <div className="position-relative d-flex align-items-center justify-content-center" style={{
                width: 48, height: 48,
                background: 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-info) 100%)',
                borderRadius: 16,
                boxShadow: '0 8px 20px rgba(139, 92, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
              }}>
                <i className="bx bx-wallet text-white" style={{ fontSize: 24 }}></i>
              </div>
            </div>
            <div>
              <h2 className="fw-bold mb-0" style={{ fontSize: '1.25rem', letterSpacing: '-0.5px', color: 'var(--bs-heading-color)' }}>BULL PAY</h2>
              <p className="mb-0" style={{ color: 'var(--bs-secondary-color)', fontSize: '0.75rem', letterSpacing: '0.5px' }}>Crypto Payment Gateway</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0); }
          33% { transform: translate(30px, -30px); }
          66% { transform: translate(-20px, 20px); }
        }
        @keyframes gradientShift {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Main Content */}
      <div className="flex-grow-1 d-flex align-items-start py-3 position-relative" style={{ zIndex: 1 }}>
        <div className="container">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--bs-primary)' }} role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error && !invoice ? (
            <div className="card border-0 shadow-lg mx-auto" style={{ maxWidth: 500, borderRadius: 12 }}>
              <div className="card-body text-center p-5">
                <div className="mb-4">
                  <i className="bx bx-error-circle" style={{ fontSize: 64, color: 'var(--bs-danger)' }}></i>
                </div>
                <h4 className="mb-3">{t('common.error', { defaultValue: 'Error' })}</h4>
                <p className="text-muted">{error}</p>
              </div>
            </div>
          ) : (
            <div className="row justify-content-center">
              <div className="col-12 col-md-10 col-lg-7 col-xl-6">
                {/* Main Card */}
                <div className="position-relative">
                  <div className="position-absolute w-100 h-100" style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(59, 130, 246, 0.2))',
                    borderRadius: 12, filter: 'blur(30px)', opacity: 0.6
                  }}></div>

                  <div className="card border-0 position-relative" style={{
                    borderRadius: 12, overflow: 'hidden',
                    background: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.15)'
                  }}>
                    {/* Title Banner */}
                    <div className="position-relative overflow-hidden" style={{
                      background: 'linear-gradient(135deg, var(--bs-primary), var(--bs-info))',
                      padding: '16px 24px'
                    }}>
                      <div className="position-absolute w-100 h-100" style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)',
                        animation: 'shimmer 3s infinite', zIndex: 0, top: 0, left: 0
                      }}></div>
                      <div className="text-center position-relative" style={{ zIndex: 1 }}>
                        <div className="d-inline-flex align-items-center gap-2">
                          <i className="bx bx-coin-stack text-white" style={{ fontSize: 20 }}></i>
                          <span className="fw-bold text-uppercase text-white" style={{
                            letterSpacing: '2px', fontSize: '0.875rem'
                          }}>
                            {t('payment.selectAsset', { defaultValue: 'Select Payment Asset' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="card-body p-3 p-md-4">
                      {/* Invoice Info */}
                      {(invoiceAmount || invoiceDesc) && (
                        <div className="mb-3 p-3 rounded-3 text-center" style={{
                          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.05), rgba(59, 130, 246, 0.05))',
                          border: '1px solid rgba(139, 92, 246, 0.15)'
                        }}>
                          {invoiceAmount && (
                            <div className="mb-1">
                              <span className="small text-uppercase fw-semibold" style={{ color: 'var(--bs-secondary-color)', letterSpacing: '1px', fontSize: '0.7rem' }}>
                                {t('invoices.amount', { defaultValue: 'Amount' })}
                              </span>
                              <div style={{
                                fontSize: '2rem', fontWeight: '900', letterSpacing: '-1px',
                                background: 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-info) 100%)',
                                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text', lineHeight: 1.2
                              }}>
                                {invoiceAmount} {invoiceCurrency}
                              </div>
                            </div>
                          )}
                          {invoiceDesc && (
                            <div className="small" style={{ color: 'var(--bs-secondary-color)' }}>{invoiceDesc}</div>
                          )}
                        </div>
                      )}

                      {/* Search */}
                      <div className="mb-3 position-relative">
                        <i className="bx bx-search position-absolute" style={{
                          left: 12, top: '50%', transform: 'translateY(-50%)',
                          color: 'var(--bs-secondary-color)', fontSize: 18
                        }}></i>
                        <input
                          type="text"
                          className="form-control"
                          placeholder={t('payment.searchCoin', { defaultValue: 'Search coin or network...' })}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          style={{
                            paddingLeft: 38, borderRadius: 10,
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            background: 'rgba(139, 92, 246, 0.03)',
                            fontSize: '0.875rem'
                          }}
                        />
                      </div>

                      {/* Coin List */}
                      <div style={{ maxHeight: 420, overflowY: 'auto', margin: '0 -4px', padding: '0 4px' }}>
                        <CoinNetworkList
                          filteredGroups={filteredGroups}
                          selectedCoinId={selectedCoinId}
                          onSelect={handleSelect}
                        />
                      </div>

                      {/* Confirm Button */}
                      <div className="mt-3">
                        <button
                          className="btn w-100 py-3 fw-bold"
                          disabled={!selectedCoinId}
                          onClick={handleConfirm}
                          style={{
                            background: selectedCoinId
                              ? 'linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-info) 100%)'
                              : 'var(--bs-border-color)',
                            color: selectedCoinId ? 'white' : 'var(--bs-secondary-color)',
                            border: 'none',
                            borderRadius: 12,
                            fontSize: '1rem',
                            letterSpacing: '0.5px',
                            transition: 'all 0.3s ease',
                            boxShadow: selectedCoinId
                              ? '0 8px 24px rgba(139, 92, 246, 0.4)'
                              : 'none',
                          }}
                        >
                          <i className="bx bx-check-circle me-2"></i>
                          {t('payment.confirmSelection', { defaultValue: 'Continue with Selected Asset' })}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-3 position-relative" style={{ zIndex: 1 }}>
        <div className="container text-center">
          <div className="mb-2" style={{
            color: 'var(--bs-secondary-color)', fontSize: '0.75rem', letterSpacing: '1px', fontWeight: '600'
          }}>{t('common.poweredBy', { defaultValue: 'Powered by' })}</div>
          <div className="mb-2" style={{
            fontSize: '1.1rem', fontWeight: '700',
            background: 'linear-gradient(135deg, var(--bs-primary), var(--bs-info))',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', letterSpacing: '1px'
          }}>BULL PAY</div>
          <div style={{ color: 'var(--bs-secondary-color)', fontSize: '0.75rem' }}>
            {t('common.copyright', { year }) || `© ${year} · All rights reserved`}
          </div>
        </div>
      </footer>
    </div>
  )
}
