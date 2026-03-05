'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

/* ── Rotating payment scenarios ── */
const SCENARIOS = [
  {
    coin: 'BTC', name: 'Bitcoin', img: '/assets/img/coins/btc.svg',
    amount: '0.042 BTC', usd: '$1,680', network: 'Lightning',
    address: 'bc1q...7xkf', accent: '#f7931a',
  },
  {
    coin: 'USDT', name: 'Tether', img: '/assets/img/coins/usdterc20.svg',
    amount: '2,500 USDT', usd: '$2,500', network: 'Tron (TRC-20)',
    address: 'TXk9...Bm3p', accent: '#26a17b',
  },
  {
    coin: 'ETH', name: 'Ethereum', img: '/assets/img/coins/eth.svg',
    amount: '1.25 ETH', usd: '$3,940', network: 'Arbitrum',
    address: '0x4a...8f21', accent: '#627eea',
  },
  {
    coin: 'USDC', name: 'USD Coin', img: '/assets/img/coins/usdc.svg',
    amount: '10,000 USDC', usd: '$10,000', network: 'Base',
    address: '0x7c...e3b4', accent: '#2775ca',
  },
  {
    coin: 'SOL', name: 'Solana', img: '/assets/img/coins/sol.svg',
    amount: '18.5 SOL', usd: '$2,775', network: 'Solana',
    address: '5Yd2...kR9m', accent: '#9945ff',
  },
]

const STEPS = [
  { label: 'Invoice created', icon: 'bx-receipt' },
  { label: 'Payment detected', icon: 'bx-search-alt' },
  { label: 'Confirmed on-chain', icon: 'bx-check-shield' },
  { label: 'Settled to wallet', icon: 'bx-wallet' },
]

/* Floating coin positions (CSS-keyframe driven) */
const FLOAT_COINS = [
  { img: '/assets/img/coins/btc.svg', cls: 'landing-float-coin-1' },
  { img: '/assets/img/coins/eth.svg', cls: 'landing-float-coin-2' },
  { img: '/assets/img/coins/usdterc20.svg', cls: 'landing-float-coin-3' },
  { img: '/assets/img/coins/sol.svg', cls: 'landing-float-coin-4' },
  { img: '/assets/img/coins/bnb.svg', cls: 'landing-float-coin-5' },
]

export default function HeroSection() {
  const mockupRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [stepIdx, setStepIdx] = useState(-1)
  const [fade, setFade] = useState(true)

  // Intersection observer — start animation when visible
  useEffect(() => {
    const el = mockupRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Step-through animation
  useEffect(() => {
    if (!visible) return
    const startDelay = setTimeout(() => setStepIdx(0), 600)
    return () => clearTimeout(startDelay)
  }, [visible])

  useEffect(() => {
    if (!visible || stepIdx < 0) return

    if (stepIdx < STEPS.length) {
      const timer = setTimeout(() => setStepIdx((s) => s + 1), 1200)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setFade(false)
        setTimeout(() => {
          setScenarioIdx((i) => (i + 1) % SCENARIOS.length)
          setStepIdx(-1)
          setFade(true)
          setTimeout(() => setStepIdx(0), 400)
        }, 400)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [visible, stepIdx])

  const sc = SCENARIOS[scenarioIdx]

  return (
    <section className="landing-hero">
      {/* ── Background decorations ── */}
      <div className="landing-hero-bg" aria-hidden="true">
        <div className="landing-hero-glow landing-hero-glow-1"></div>
        <div className="landing-hero-glow landing-hero-glow-2"></div>
        <div className="landing-hero-grid"></div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ── Left column ── */}
          <div className="mb-5 lg:mb-0">
            {/* Badge */}
            <div className="landing-hero-badge mb-5">
              <span className="landing-hero-badge-dot"></span>
              Crypto Payment Gateway
            </div>

            <h1 className="landing-hero-title mb-5">
              Accept crypto{' '}
              <span className="landing-hero-title-accent">payments</span>,
              <br />
              the simple way
            </h1>

            <p className="landing-hero-desc mb-6">
              9 coins across 30+ blockchain networks. Low fees, instant
              settlement — everything your business needs to go crypto.
            </p>

            <div className="flex gap-3 items-center flex-wrap mb-6">
              <Link href="/register" className="landing-hero-cta">
                Start accepting payments
                <i className="bx bx-right-arrow-alt ml-2 text-lg"></i>
              </Link>
              <Link href="/login" className="landing-hero-cta-secondary">
                Sign in
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex items-center gap-5 flex-wrap">
              <div className="landing-hero-trust">
                <i className="bx bx-check-circle"></i> No monthly fees
              </div>
              <div className="landing-hero-trust">
                <i className="bx bx-check-circle"></i> Non-custodial
              </div>
              <div className="landing-hero-trust">
                <i className="bx bx-check-circle"></i> Instant settlement
              </div>
            </div>
          </div>

          {/* ── Right column — Mockup with floating coins ── */}
          <div className="relative" ref={mockupRef}>
            {/* Floating coins */}
            {FLOAT_COINS.map((c, i) => (
              <div key={i} className={`landing-float-coin ${c.cls}`}>
                <Image src={c.img} alt="" width={36} height={36} />
              </div>
            ))}

            {/* Card glow */}
            <div className="landing-mockup-glow" aria-hidden="true"></div>

            {/* Main card */}
            <div className="landing-mockup-v2">
              {/* Header bar */}
              <div className="landing-mockup-v2-header">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }}></div>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }}></div>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }}></div>
                </div>
                <div className="landing-mockup-v2-url">
                  <i className="bx bx-lock-alt" style={{ fontSize: '0.65rem' }}></i>
                  app.bullpay.com
                </div>
                <div style={{ width: 48 }}></div>
              </div>

              {/* Body */}
              <div className="landing-mockup-v2-body">
                <div
                  style={{
                    opacity: fade ? 1 : 0,
                    transform: fade ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'opacity 0.45s cubic-bezier(.4,0,.2,1), transform 0.45s cubic-bezier(.4,0,.2,1)',
                  }}
                >
                  {/* Coin header card */}
                  <div className="landing-mockup-coin-card" style={{ '--coin-accent': sc.accent }}>
                    <div className="landing-mockup-coin-icon-wrap">
                      <Image src={sc.img} alt={sc.coin} width={44} height={44} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="landing-mockup-coin-name">{sc.name}</div>
                      <div className="landing-mockup-coin-network">
                        <i className="bx bx-link-alt" style={{ fontSize: '0.7rem' }}></i>
                        {sc.network}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="landing-mockup-coin-usd">{sc.usd}</div>
                      <div className="landing-mockup-coin-amount">{sc.amount}</div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="landing-mockup-addr-section">
                    <div className="landing-mockup-addr-label">
                      <i className="bx bx-copy-alt"></i> Payment Address
                    </div>
                    <div className="landing-mockup-addr-box">
                      <span>{sc.address}</span>
                      <i className="bx bx-copy text-slate-400 ml-auto text-sm"></i>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="landing-mockup-steps">
                    {STEPS.map((step, i) => {
                      const done = stepIdx > i
                      const active = stepIdx === i

                      return (
                        <div key={step.label} className="landing-mockup-step-row">
                          {/* Connector line */}
                          {i > 0 && (
                            <div
                              className="landing-mockup-step-line"
                              style={{ background: done || active ? '#2563eb' : '#e2e8f0' }}
                            />
                          )}
                          {/* Circle */}
                          <div
                            className={`landing-mockup-step-circle ${done ?'is-done' : ''} ${active ? 'is-active' : ''}`}
                          >
                            <i className={`bx ${done ?'bx-check' : step.icon}`}></i>
                          </div>
                          {/* Text */}
                          <div
                            className="landing-mockup-step-text"
                            style={{
                              color: done ? '#2563eb' : active ? '#0f172a' : '#cbd5e1',
                              fontWeight: done || active ? 600 : 400,
                            }}
                          >
                            {step.label}
                            {active && <span className="landing-pulse-dot"></span>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
