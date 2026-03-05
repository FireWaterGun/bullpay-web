'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import HeroSection from '@/components/landing/HeroSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import FooterSection from '@/components/landing/FooterSection'
import '@/components/landing/LandingPage.css'

const CRYPTO_LIST = [
  { name: 'Tether', symbol: 'USDT', img: '/assets/img/coins/usdterc20.svg' },
  { name: 'USD Coin', symbol: 'USDC', img: '/assets/img/coins/usdc.svg' },
  { name: 'Bitcoin', symbol: 'BTC', img: '/assets/img/coins/btc.svg' },
  { name: 'Ethereum', symbol: 'ETH', img: '/assets/img/coins/eth.svg' },
  { name: 'BNB', symbol: 'BNB', img: '/assets/img/coins/bnb.svg' },
  { name: 'Solana', symbol: 'SOL', img: '/assets/img/coins/sol.svg' },
  { name: 'Tron', symbol: 'TRX', img: '/assets/img/coins/trx.svg' },
  { name: 'Polygon', symbol: 'POL', img: '/assets/img/coins/matic.svg' },
  { name: 'Avalanche', symbol: 'AVAX', img: '/assets/img/coins/avax.svg' },
] as const

export default function LandingPage() {
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light')
    return () => {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [])

  return (
    <div className="landing-page">
      {/* ── Navbar ── */}
      <nav className="landing-navbar sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 w-full flex items-center justify-between h-16">
          {/* Logo */}
          <Link className="flex items-center no-underline shrink-0" href="/">
            <i className="bx bxs-wallet-alt text-3xl mr-2" style={{ color: '#2563eb' }}></i>
            <span className="font-bold text-2xl tracking-tight">
              <span style={{ color: '#0f172a' }}>BULL</span>
              <span style={{ color: '#2563eb' }}>PAY</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            <a className="landing-nav-link" href="#features">Features</a>
            <a className="landing-nav-link" href="#currencies">Currencies</a>
            <div className="w-px h-5 bg-slate-200 mx-3"></div>
            <Link href="/login" className="landing-nav-link">Login</Link>
            <Link href="/register" className="landing-btn-primary ml-2 text-sm !py-2.5 !px-5">
              Get Started
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            className="lg:hidden flex items-center justify-center w-10 h-10 rounded-lg hover:bg-black/5 transition-colors border-0 bg-transparent cursor-pointer"
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setNavOpen(!navOpen)}
          >
            <i className={`bx ${navOpen ? 'bx-x' : 'bx-menu'} text-2xl`} style={{ color: '#0f172a' }}></i>
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${navOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 pb-5 pt-2 flex flex-col gap-1 border-t border-slate-200/60">
            <a className="landing-nav-link-mobile" href="#features" onClick={() => setNavOpen(false)}>Features</a>
            <a className="landing-nav-link-mobile" href="#currencies" onClick={() => setNavOpen(false)}>Currencies</a>
            <div className="h-px bg-slate-200/60 my-2"></div>
            <Link href="/login" className="landing-nav-link-mobile" onClick={() => setNavOpen(false)}>Login</Link>
            <Link href="/register" className="landing-btn-primary text-center text-sm !py-2.5 mt-1" onClick={() => setNavOpen(false)}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <HeroSection />

      <HowItWorksSection />

      <FeaturesSection />

      {/* ── Supported Cryptocurrencies ── */}
      <section id="currencies" className="landing-section" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="text-center mb-5">
            <h2 className="landing-section-title mb-3">9 coins, 30+ networks</h2>
            <p className="landing-section-subtitle mb-0">
              Accept payments across multiple blockchain networks
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {CRYPTO_LIST.map((crypto) => (
              <div key={crypto.symbol} className="landing-crypto-pill">
                <Image src={crypto.img} alt={crypto.symbol} width={28} height={28} style={{ objectFit: 'contain' }} />
                <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1a1a2e' }}>{crypto.symbol}</span>
              </div>
            ))}
            <div className="landing-crypto-pill" style={{ background: '#2563eb', color: '#fff' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>30+ chains</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="landing-section">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
          <div className="landing-tile landing-tile-navy text-center">
            <h2 className="landing-cta-title mb-3">Ready to accept crypto?</h2>
            <p className="mb-5" style={{ color: 'rgba(255,255,255,0.6)', maxWidth: 420, margin: '0 auto', fontSize: '1.05rem', lineHeight: 1.6 }}>
              Set up your account in minutes. No monthly fees, no hidden charges.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/register" className="btn btn-lg px-5 py-3 landing-btn-white" style={{ fontSize: '1.05rem' }}>
                Get started free
                <i className="bx bx-right-arrow-alt ml-2"></i>
              </Link>
              <Link href="/login" className="btn btn-lg px-5 py-3 landing-btn-white-outline" style={{ fontSize: '1.05rem' }}>
                Sign in
              </Link>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  )
}
