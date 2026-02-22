import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import HeroSection from './sections/HeroSection'
import HowItWorksSection from './sections/HowItWorksSection'
import FeaturesSection from './sections/FeaturesSection'
import FooterSection from './sections/FooterSection'
import './LandingPage.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  useEffect(() => {
    // Set light theme for landing page
    document.documentElement.setAttribute('data-bs-theme', 'light')
    document.body.style.backgroundColor = 'var(--bs-tertiary-bg)'

    return () => {
      document.body.style.backgroundColor = ''
    }
  }, [])

  const cryptoList = [
    { name: 'Bitcoin', symbol: 'BTC', img: '/assets/img/coins/btc.svg' },
    { name: 'Ethereum', symbol: 'ETH', img: '/assets/img/coins/eth.svg' },
    { name: 'Litecoin', symbol: 'LTC', img: '/assets/img/coins/ltc.svg' },
    { name: 'Dogecoin', symbol: 'DOGE', img: '/assets/img/coins/doge.svg' },
    { name: 'Tether', symbol: 'USDT', img: '/assets/img/coins/usdterc20.svg' },
    { name: 'USD Coin', symbol: 'USDC', img: '/assets/img/coins/usdc.svg' },
    { name: 'Ripple', symbol: 'XRP', img: '/assets/img/coins/xrp.svg' },
    { name: 'Cardano', symbol: 'ADA', img: '/assets/img/coins/ada.svg' },
    { name: 'Solana', symbol: 'SOL', img: '/assets/img/coins/sol.svg' },
    { name: 'Polygon', symbol: 'MATIC', img: '/assets/img/coins/matic.svg' },
    { name: 'Tron', symbol: 'TRX', img: '/assets/img/coins/trx.svg' },
    { name: 'Avalanche', symbol: 'AVAX', img: '/assets/img/coins/avax.svg' },
    { name: 'BNB', symbol: 'BNB', img: '/assets/img/coins/bnb.svg' },
    { name: 'Stellar', symbol: 'XLM', img: '/assets/img/coins/xlm.svg' },
    { name: 'Algorand', symbol: 'ALGO', img: '/assets/img/coins/algo.svg' },
    { name: 'Polkadot', symbol: 'DOT', img: '/assets/img/coins/dot.svg' },
    { name: 'Shiba Inu', symbol: 'SHIB', img: '/assets/img/coins/shib.svg' },
    { name: 'TON', symbol: 'TON', img: '/assets/img/coins/ton.svg' },
  ]

  const features = [
    { title: '50+ Cryptocurrencies', desc: 'Support for major coins and tokens', icon: 'bx-coin-stack' },
    { title: 'Multiple Blockchains', desc: 'Bitcoin, Ethereum, Solana, and more', icon: 'bx-network-chart' },
    { title: 'Low Fees', desc: 'Competitive transaction fees', icon: 'bx-wallet' },
    { title: 'Fast Settlement', desc: 'Quick crypto to fiat conversion', icon: 'bx-time-five' },
    { title: 'Secure & Safe', desc: 'Bank-grade security standards', icon: 'bx-shield-quarter' },
    { title: '24/7 Support', desc: 'Round-the-clock customer service', icon: 'bx-support' },
  ]

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="navbar navbar-expand-lg navbar-light sticky-top bg-white shadow-sm">
        <div className="container-xxl">
          <a className="navbar-brand d-flex align-items-center" href="/">
            <div className="brand-icon me-2">
              <i className="bx bxs-wallet-alt fs-2 text-primary"></i>
            </div>
            <span className="fw-bold fs-3">
              <span className="text-dark">BULL</span>
              <span className="text-primary">PAY</span>
            </span>
          </a>
          <button className="navbar-toggler border-0" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-center">
              <li className="nav-item">
                <a className="nav-link text-muted px-3" href="#features">Features</a>
              </li>
              <li className="nav-item">
                <a className="nav-link text-muted px-3" href="#currencies">Currencies</a>
              </li>
              <li className="nav-item ms-3">
                <button className="btn btn-outline-dark btn-sm px-4" onClick={() => navigate('/login')}>
                  Login
                </button>
              </li>
              <li className="nav-item ms-2">
                <button className="btn btn-primary btn-sm px-4 fw-semibold" onClick={() => navigate('/register')}>
                  Get Started
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <HeroSection navigate={navigate} />

      <HowItWorksSection />

      <FeaturesSection />

      {/* How to Start */}
      <section className="position-relative" style={{ background: 'var(--bs-body-bg)', paddingTop: '6rem', paddingBottom: '6rem' }}>
        {/* Decorative grid pattern */}
        <div className="position-absolute w-100 h-100" style={{ opacity: 0.03, backgroundImage: 'radial-gradient(circle, var(--bs-body-color) 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>

        <div className="container-xxl py-5 position-relative">
          <div className="row justify-content-center mb-5">
            <div className="col-lg-8 text-center">
              <h2 className="display-5 fw-bold mb-3">How to start</h2>
              <p className="text-muted fs-6 mb-0">Begin accepting crypto payments with BULL PAY by following these steps</p>
            </div>
          </div>

          <div className="row g-4">
            {/* Step 1 */}
            <div className="col-md-6 col-lg-4">
              <div className="text-center p-4">
                <div className="mb-3">
                  <i className="bx bx-user-plus" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="fw-bold mb-2">Sign up <span className="text-muted fw-normal">and complete KYC</span></h5>
              </div>
            </div>

            {/* Step 2 */}
            <div className="col-md-6 col-lg-4">
              <div className="text-center p-4">
                <div className="mb-3">
                  <i className="bx bx-wallet" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="fw-bold mb-2">Create <span className="text-muted fw-normal">a crypto wallet</span></h5>
              </div>
            </div>

            {/* Step 3 */}
            <div className="col-md-6 col-lg-4">
              <div className="text-center p-4">
                <div className="mb-3">
                  <i className="bx bx-code-alt" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="fw-bold mb-2">Integrate <span className="text-muted fw-normal">via API</span></h5>
              </div>
            </div>

            {/* Step 4 */}
            <div className="col-md-6 col-lg-4">
              <div className="text-center p-4">
                <div className="mb-3">
                  <i className="bx bx-cog" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="fw-bold mb-2">Configure <span className="text-muted fw-normal">security settings</span></h5>
              </div>
            </div>

            {/* Step 5 */}
            <div className="col-md-6 col-lg-4">
              <div className="text-center p-4">
                <div className="mb-3">
                  <i className="bx bx-dollar-circle" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="fw-bold mb-2">Start accepting <span className="text-muted fw-normal">crypto payments</span></h5>
              </div>
            </div>

            {/* Step 6 */}
            <div className="col-md-6 col-lg-4">
              <div className="text-center p-4">
                <div className="mb-3">
                  <i className="bx bx-user-circle" style={{ fontSize: '3rem' }}></i>
                </div>
                <h5 className="fw-bold mb-2">Sign Up</h5>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Cryptocurrencies */}
      <section id="currencies" className="position-relative" style={{ background: 'var(--bs-tertiary-bg)', paddingTop: '6rem', paddingBottom: '6rem' }}>
        {/* Decorative crypto symbols */}
        <div className="position-absolute" style={{ top: '15%', left: '8%', fontSize: '4rem', opacity: 0.03 }}>
          <i className="bx bxl-bitcoin"></i>
        </div>
        <div className="position-absolute" style={{ top: '20%', right: '10%', fontSize: '3rem', opacity: 0.03 }}>
          <i className="bx bxl-ethereum"></i>
        </div>
        <div className="position-absolute" style={{ bottom: '15%', right: '8%', fontSize: '3.5rem', opacity: 0.03 }}>
          <i className="bx bx-dollar-circle"></i>
        </div>

        <div className="container-xxl py-5 position-relative">
          <div className="row justify-content-center mb-5">
            <div className="col-lg-8 text-center">
              <h2 className="display-5 fw-bold mb-3">50+ Cryptocurrencies Supported</h2>
              <p className="text-muted fs-6 mb-0">Accept payments across multiple blockchain networks</p>
            </div>
          </div>
          <div className="row g-3">
            {cryptoList.map((crypto) => (
              <div key={crypto.name} className="col-6 col-sm-4 col-md-3 col-lg-2">
                <div className="card text-center border hover-lift h-100" style={{ borderColor: 'var(--bs-border-color)', transition: 'all 0.3s ease' }}>
                  <div className="card-body p-3">
                    <div className="crypto-icon-wrapper mb-2">
                      <img
                        src={crypto.img}
                        alt={crypto.name}
                        className="crypto-icon"
                        style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                      />
                    </div>
                    <h6 className="mb-1 fw-semibold">{crypto.name}</h6>
                    <small className="text-muted">{crypto.symbol}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-5">
            <div className="d-inline-flex flex-column align-items-center gap-3">
              <p className="text-muted mb-0">Support for 50+ cryptocurrencies and growing</p>
              {/* <button className="btn btn-outline-dark btn-lg px-5 py-3 d-inline-flex align-items-center gap-2">
                <span className="fw-semibold">View All Currencies</span>
                <i className="bx bx-right-arrow-alt fs-5"></i>
              </button> */}
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  )
}
