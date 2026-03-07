'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

/* ── Rotating payment scenarios ── */
const SCENARIOS = [
  {
    coin: 'BTC',
    name: 'Bitcoin',
    img: '/assets/img/coins/btc.svg',
    amount: '0.042 BTC',
    usd: '$1,680',
    network: 'Lightning',
    address: 'bc1q...7xkf',
    accent: '#f7931a',
  },
  {
    coin: 'USDT',
    name: 'Tether',
    img: '/assets/img/coins/usdterc20.svg',
    amount: '2,500 USDT',
    usd: '$2,500',
    network: 'Tron (TRC-20)',
    address: 'TXk9...Bm3p',
    accent: '#26a17b',
  },
  {
    coin: 'ETH',
    name: 'Ethereum',
    img: '/assets/img/coins/eth.svg',
    amount: '1.25 ETH',
    usd: '$3,940',
    network: 'Arbitrum',
    address: '0x4a...8f21',
    accent: '#627eea',
  },
  {
    coin: 'USDC',
    name: 'USD Coin',
    img: '/assets/img/coins/usdc.svg',
    amount: '10,000 USDC',
    usd: '$10,000',
    network: 'Base',
    address: '0x7c...e3b4',
    accent: '#2775ca',
  },
  {
    coin: 'SOL',
    name: 'Solana',
    img: '/assets/img/coins/sol.svg',
    amount: '18.5 SOL',
    usd: '$2,775',
    network: 'Solana',
    address: '5Yd2...kR9m',
    accent: '#9945ff',
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
  { img: '/assets/img/coins/btc.svg', style: { top: '2%', right: -8, animationName: 'landing-float-1' } },
  {
    img: '/assets/img/coins/eth.svg',
    style: { top: '18%', left: -20, animationName: 'landing-float-2', animationDelay: '0.8s' },
  },
  {
    img: '/assets/img/coins/usdterc20.svg',
    style: { bottom: '25%', right: -16, animationName: 'landing-float-1', animationDelay: '1.6s' },
  },
  {
    img: '/assets/img/coins/sol.svg',
    style: { bottom: '5%', left: -12, animationName: 'landing-float-2', animationDelay: '2.4s' },
  },
  {
    img: '/assets/img/coins/bnb.svg',
    style: { top: '50%', right: -22, animationName: 'landing-float-1', animationDelay: '3.2s', width: 38, height: 38 },
  },
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
    <section className="pt-28 pb-16 lg:pt-40 lg:pb-28 relative overflow-hidden">
      {/* ── Background decorations ── */}
      <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
        <div className="absolute rounded-full blur-[80px] opacity-45 w-[600px] h-[600px] bg-[radial-gradient(circle,#3b82f6_0%,transparent_70%)] -top-[120px] -right-[80px]"></div>
        <div className="absolute rounded-full blur-[80px] opacity-30 w-[400px] h-[400px] bg-[radial-gradient(circle,#a78bfa_0%,transparent_70%)] -bottom-[60px] -left-[40px]"></div>
        <div className="landing-hero-grid"></div>
      </div>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* ── Left column ── */}
          <div className="mb-5 lg:mb-0">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-[rgba(37,99,235,0.08)] border border-[rgba(37,99,235,0.15)] rounded-full py-1.5 pl-3 pr-4 text-[0.82rem] font-semibold text-primary-600 tracking-[0.01em] mb-5">
              <span className="w-[7px] h-[7px] rounded-full bg-primary-600 animate-[landing-pulse_2s_ease-in-out_infinite]"></span>
              Crypto Payment Gateway
            </div>

            <h1 className="text-[2.5rem] sm:text-[3rem] lg:text-[4.2rem] font-extrabold leading-[1.08] text-surface-900 tracking-[-0.035em] mb-5">
              Accept crypto{' '}
              <span className="bg-gradient-to-br from-primary-600 to-violet-600 bg-clip-text text-transparent">
                payments
              </span>
              ,
              <br />
              the simple way
            </h1>

            <p className="text-surface-500 text-[1.15rem] leading-[1.75] max-w-[460px] mb-6">
              9 coins across 30+ blockchain networks. Low fees, instant settlement — everything your business needs to
              go crypto.
            </p>

            <div className="flex gap-3 items-center flex-wrap mb-6">
              <Link
                href="/register"
                className="inline-flex items-center bg-gradient-to-br from-primary-600 to-primary-700 text-white font-semibold text-[0.95rem] rounded-[14px] py-3.5 px-7 no-underline transition-[transform,box-shadow] duration-150 shadow-[0_4px_16px_rgba(37,99,235,0.25),inset_0_1px_0_rgba(255,255,255,0.1)] hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(37,99,235,0.35),inset_0_1px_0_rgba(255,255,255,0.1)] hover:text-white w-full sm:w-auto justify-center sm:justify-start"
              >
                Start accepting payments
                <i className="bx bx-right-arrow-alt ml-2 text-lg"></i>
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center bg-transparent text-surface-600 font-semibold text-[0.95rem] rounded-[14px] py-3.5 px-6 no-underline border-[1.5px] border-surface-200 transition-[border-color,color] duration-200 hover:border-surface-400 hover:text-surface-900 w-full sm:w-auto justify-center sm:justify-start"
              >
                Sign in
              </Link>
            </div>

            {/* Trust row */}
            <div className="flex items-center gap-5 flex-wrap">
              <div className="inline-flex items-center gap-[5px] text-[0.82rem] text-surface-500 font-medium">
                <i className="bx bx-check-circle text-success-500 text-base"></i> No monthly fees
              </div>
              <div className="inline-flex items-center gap-[5px] text-[0.82rem] text-surface-500 font-medium">
                <i className="bx bx-check-circle text-success-500 text-base"></i> Non-custodial
              </div>
              <div className="inline-flex items-center gap-[5px] text-[0.82rem] text-surface-500 font-medium">
                <i className="bx bx-check-circle text-success-500 text-base"></i> Instant settlement
              </div>
            </div>
          </div>

          {/* ── Right column — Mockup with floating coins ── */}
          <div className="relative" ref={mockupRef}>
            {/* Floating coins */}
            {FLOAT_COINS.map((c, i) => (
              <div
                key={i}
                className="absolute z-20 w-11 h-11 bg-card rounded-full hidden lg:flex items-center justify-center shadow-[0_8px_24px_rgba(15,23,42,0.1),0_2px_6px_rgba(15,23,42,0.05)]"
                style={{
                  animationDuration: '6s',
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                  ...c.style,
                }}
              >
                <Image
                  src={c.img}
                  alt=""
                  width={c.style.width === 38 ? 22 : 26}
                  height={c.style.width === 38 ? 22 : 26}
                />
              </div>
            ))}

            {/* Card glow */}
            <div
              className="absolute -inset-0.5 rounded-[22px] bg-gradient-to-br from-[rgba(37,99,235,0.2)] via-[rgba(124,58,237,0.12)] to-[rgba(37,99,235,0.08)] blur-[1px] z-0 hidden lg:block"
              aria-hidden="true"
            ></div>

            {/* Main card */}
            <div className="relative z-[1] rounded-[20px] bg-white/[0.92] backdrop-blur-[20px] backdrop-saturate-[1.2] border border-white/60 shadow-[0_32px_80px_rgba(15,23,42,0.12),0_8px_24px_rgba(15,23,42,0.06),inset_0_1px_0_rgba(255,255,255,0.8)] overflow-hidden">
              {/* Header bar */}
              <div className="flex items-center justify-between py-3 px-[18px] bg-surface-100/70 border-b border-surface-200/50">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#ff5f57' }}></div>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#febc2e' }}></div>
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#28c840' }}></div>
                </div>
                <div className="flex items-center gap-[5px] bg-white/70 border border-surface-200 rounded-lg py-1 px-4 text-[0.7rem] text-surface-500 font-medium">
                  <i className="bx bx-lock-alt text-[0.65rem]"></i>
                  app.bullpay.com
                </div>
                <div className="w-12"></div>
              </div>

              {/* Body */}
              <div className="p-5 min-h-[320px] sm:p-7 sm:min-h-[370px]">
                <div
                  style={{
                    opacity: fade ? 1 : 0,
                    transform: fade ? 'translateY(0)' : 'translateY(12px)',
                    transition: 'opacity 0.45s cubic-bezier(.4,0,.2,1), transform 0.45s cubic-bezier(.4,0,.2,1)',
                  }}
                >
                  {/* Coin header card */}
                  <div
                    className="flex items-center gap-2.5 py-3 px-3.5 sm:gap-3.5 sm:py-4 sm:px-[18px] rounded-[14px] bg-gradient-to-br from-slate-50/80 to-slate-100/50 border border-surface-200/60 mb-[22px]"
                    style={{ '--coin-accent': sc.accent }}
                  >
                    <div className="w-[42px] h-[42px] sm:w-[52px] sm:h-[52px] rounded-[14px] bg-card flex items-center justify-center shadow-[0_2px_8px_rgba(15,23,42,0.06)] shrink-0">
                      <Image src={sc.img} alt={sc.coin} width={44} height={44} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-base text-surface-900">{sc.name}</div>
                      <div className="flex items-center gap-1 text-xs text-surface-400 mt-0.5">
                        <i className="bx bx-link-alt text-[0.7rem]"></i>
                        {sc.network}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-[1.15rem] text-surface-900">{sc.usd}</div>
                      <div className="text-[0.72rem] text-surface-400 mt-0.5">{sc.amount}</div>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="mb-6">
                    <div className="flex items-center gap-[5px] text-[0.68rem] text-surface-400 font-semibold uppercase tracking-[0.08em] mb-2">
                      <i className="bx bx-copy-alt"></i> Payment Address
                    </div>
                    <div className="flex items-center bg-surface-50/80 border border-surface-200 rounded-[10px] py-2.5 px-3.5 font-mono text-[0.82rem] text-surface-600 tracking-[0.02em]">
                      <span>{sc.address}</span>
                      <i className="bx bx-copy text-surface-400 ml-auto text-sm"></i>
                    </div>
                  </div>

                  {/* Steps */}
                  <div className="flex flex-col gap-0">
                    {STEPS.map((step, i) => {
                      const done = stepIdx > i
                      const active = stepIdx === i

                      return (
                        <div key={step.label} className="flex items-center gap-3 relative min-h-[46px] pl-1">
                          {/* Connector line */}
                          {i > 0 && (
                            <div
                              className="absolute left-[17px] -top-3 w-0.5 h-3.5 rounded-[1px] transition-[background] duration-[400ms] ease-out"
                              style={{ background: done || active ? '#2563eb' : '#e2e8f0' }}
                            />
                          )}
                          {/* Circle */}
                          <div
                            className={`w-9 h-9 rounded-[10px] flex items-center justify-center text-[0.85rem] shrink-0 transition-all duration-[400ms] ease-[cubic-bezier(.4,0,.2,1)] ${
                              done
                                ? 'bg-primary-600 text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)]'
                                : active
                                  ? 'bg-primary-100 text-primary-600 border-2 border-primary-600 shadow-[0_0_0_5px_rgba(37,99,235,0.08)]'
                                  : 'bg-surface-100 text-surface-300'
                            }`}
                          >
                            <i className={`bx ${done ? 'bx-check' : step.icon}`}></i>
                          </div>
                          {/* Text */}
                          <div
                            className="text-[0.84rem] transition-all duration-300 ease-out"
                            style={{
                              color: done ? '#2563eb' : active ? '#0f172a' : '#cbd5e1',
                              fontWeight: done || active ? 600 : 400,
                            }}
                          >
                            {step.label}
                            {active && (
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary-600 ml-2 align-middle animate-[landing-pulse_1.2s_ease-in-out_infinite]"></span>
                            )}
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
