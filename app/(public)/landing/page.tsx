'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import HeroSection from '@/components/landing/HeroSection'
import HowItWorksSection from '@/components/landing/HowItWorksSection'
import FeaturesSection from '@/components/landing/FeaturesSection'
import FooterSection from '@/components/landing/FooterSection'

/* ── Reusable Tailwind class strings ── */
const navLink =
  'text-[#090b0c] font-medium text-[0.9rem] py-2 px-3.5 rounded-lg transition-colors no-underline whitespace-nowrap hover:text-surface-900 hover:bg-[rgba(15,23,42,0.05)]'
const navLinkMobile =
  'block text-slate-700 font-medium text-[0.95rem] py-2.5 px-3 rounded-[10px] transition-[color,background] duration-150 no-underline hover:text-surface-900 hover:bg-[rgba(15,23,42,0.05)]'
const btnPrimary =
  'bg-primary-600 border-none text-white font-semibold rounded-full py-2.5 px-7 text-[0.95rem] no-underline transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(37,99,235,0.35)] hover:text-white'
const sectionTitle =
  'text-[1.75rem] sm:text-[2.25rem] lg:text-[2.75rem] font-extrabold text-surface-900 tracking-[-0.025em] leading-[1.15]'
const sectionSubtitle = 'text-slate-500 text-[1.1rem] leading-[1.6]'
const tile =
  'py-10 px-6 rounded-2xl sm:py-12 sm:px-8 sm:rounded-[20px] lg:py-20 lg:px-16 lg:rounded-3xl'
const cryptoPill =
  'bg-white rounded-full py-3 pr-5 pl-3.5 inline-flex gap-3 items-center transition-[transform,box-shadow] duration-200 hover:-translate-y-px hover:shadow-[0_4px_16px_rgba(15,23,42,0.08)]'

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
    <div className="overflow-x-hidden bg-[#f0f4f8] min-h-screen text-surface-900 antialiased">
      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 bg-white/[0.82] backdrop-blur-[20px] backdrop-saturate-150 border-b border-[rgba(15,23,42,0.06)] shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 w-full flex items-center justify-between h-16">
          {/* Logo */}
          <Link className="flex items-center no-underline shrink-0" href="/">
            <i className="bx bxs-wallet-alt text-3xl mr-2 text-primary-600"></i>
            <span className="font-bold text-2xl tracking-tight">
              <span className="text-surface-900">BULL</span>
              <span className="text-primary-600">PAY</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden lg:flex items-center gap-1">
            <a className={navLink} href="#features">Features</a>
            <a className={navLink} href="#currencies">Currencies</a>
            <div className="w-px h-5 bg-slate-200 mx-3"></div>
            <Link href="/login" className={navLink}>Login</Link>
            <Link href="/register" className={`${btnPrimary} ml-2 text-sm !py-2.5 !px-5`}>
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
            <i className={`bx ${navOpen ? 'bx-x' : 'bx-menu'} text-2xl text-surface-900`}></i>
          </button>
        </div>

        {/* Mobile menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${navOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 pb-5 pt-2 flex flex-col gap-1 border-t border-slate-200/60">
            <a className={navLinkMobile} href="#features" onClick={() => setNavOpen(false)}>Features</a>
            <a className={navLinkMobile} href="#currencies" onClick={() => setNavOpen(false)}>Currencies</a>
            <div className="h-px bg-slate-200/60 my-2"></div>
            <Link href="/login" className={navLinkMobile} onClick={() => setNavOpen(false)}>Login</Link>
            <Link href="/register" className={`${btnPrimary} text-center text-sm !py-2.5 mt-1`} onClick={() => setNavOpen(false)}>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <HeroSection />

      <HowItWorksSection />

      <FeaturesSection />

      {/* ── Supported Cryptocurrencies ── */}
      <section id="currencies" className="py-6 pt-16 pb-16">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-5">
            <h2 className={`${sectionTitle} mb-3`}>9 coins, 30+ networks</h2>
            <p className={`${sectionSubtitle} mb-0`}>
              Accept payments across multiple blockchain networks
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {CRYPTO_LIST.map((crypto) => (
              <div key={crypto.symbol} className={cryptoPill}>
                <Image className="object-contain" src={crypto.img} alt={crypto.symbol} width={28} height={28} />
                <span className="font-semibold text-[0.9rem] text-surface-900">{crypto.symbol}</span>
              </div>
            ))}
            <div className={`${cryptoPill} !bg-primary-600 text-white`}>
              <span className="font-semibold text-[0.9rem]">30+ chains</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-6">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
          <div className={`${tile} bg-slate-900 text-white text-center`}>
            <h2 className="text-[1.75rem] sm:text-[2.25rem] lg:text-[2.75rem] font-extrabold text-white tracking-[-0.02em] mb-3">Ready to accept crypto?</h2>
            <p className="mb-5 text-white/60 max-w-[420px] mx-auto text-[1.05rem] leading-[1.6]">
              Set up your account in minutes. No monthly fees, no hidden charges.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link href="/register" className="inline-flex items-center justify-center bg-white border-none text-slate-900 font-semibold rounded-full px-5 py-3 text-[1.05rem] no-underline transition-[transform,box-shadow] duration-150 hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(0,0,0,0.12)] hover:text-slate-900">
                Get started free
                <i className="bx bx-right-arrow-alt ml-2"></i>
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center bg-transparent border-[1.5px] border-white/30 text-white font-semibold rounded-full px-5 py-3 text-[1.05rem] no-underline transition-colors duration-200 hover:border-white hover:text-white">
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
