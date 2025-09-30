import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import './LandingPage.css'

export default function LandingPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  useEffect(() => {
    // Set light theme for landing page
    document.documentElement.setAttribute('data-bs-theme', 'light')
    document.body.style.backgroundColor = '#fff'
    
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
              <i className="bx bxs-wallet-alt fs-2 text-warning"></i>
            </div>
            <span className="fw-bold fs-3">
              <span className="text-dark">BULL</span>
              <span className="text-warning">PAY</span>
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
                <button className="btn btn-warning btn-sm px-4 fw-semibold" onClick={() => navigate('/register')}>
                  Get Started
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section position-relative overflow-hidden" style={{ 
        background: '#ffffff',
        paddingTop: '8rem',
        paddingBottom: '8rem'
      }}>
        {/* Decorative Background Elements */}
        <div className="position-absolute w-100 h-100" style={{ opacity: 0.4 }}>
          <div className="position-absolute" style={{ top: '20%', left: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)', filter: 'blur(60px)' }}></div>
          <div className="position-absolute" style={{ bottom: '20%', right: '10%', width: '250px', height: '250px', background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
        </div>

        <div className="container-xxl position-relative">
          <div className="row align-items-center">
            <div className="col-lg-6 mb-5 mb-lg-0">
              <div className="badge bg-warning bg-opacity-10 text-warning border border-warning px-3 py-2 mb-4">
                <i className="bx bx-trending-up me-1"></i>
                Trusted by 1000+ Businesses
              </div>
              <h1 className="display-2 fw-bold mb-4" style={{ lineHeight: '1.2' }}>
                Accept Crypto
                <br />
                <span className="text-warning">Payments</span> Today
              </h1>
              <p className="lead text-muted mb-5" style={{ fontSize: '1.25rem' }}>
                Professional cryptocurrency payment gateway supporting 50+ digital currencies. 
                Low fees, instant settlement, and enterprise-grade security.
              </p>
              <div className="d-flex gap-3 flex-wrap mb-5">
                <button className="btn btn-warning btn-lg px-5 py-3 fw-semibold shadow" onClick={() => navigate('/register')}>
                  Get Started Free
                  <i className="bx bx-right-arrow-alt ms-2"></i>
                </button>
                <button className="btn btn-outline-dark btn-lg px-5 py-3" onClick={() => document.getElementById('features').scrollIntoView({ behavior: 'smooth' })}>
                  View Features
                </button>
              </div>
              
              {/* Stats */}
              <div className="row g-4 mt-3">
                <div className="col-4">
                  <div className="text-warning fw-bold fs-2">50+</div>
                  <div className="text-muted small">Cryptocurrencies</div>
                </div>
                <div className="col-4">
                  <div className="text-warning fw-bold fs-2">0.5%</div>
                  <div className="text-muted small">Transaction Fee</div>
                </div>
                <div className="col-4">
                  <div className="text-warning fw-bold fs-2">24/7</div>
                  <div className="text-muted small">Support</div>
                </div>
              </div>
            </div>
            
            <div className="col-lg-6">
              <div className="position-relative">
                {/* Floating Crypto Cards */}
                <div className="crypto-showcase">
                  <div className="crypto-card-float" style={{ animation: 'float 6s ease-in-out infinite' }}>
                    <div className="card border-0 shadow-lg">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center gap-3">
                            <img src="/assets/img/coins/btc.svg" alt="BTC" style={{ width: '40px', height: '40px' }} />
                            <div>
                              <div className="fw-semibold">Bitcoin</div>
                              <small className="text-muted">BTC</small>
                            </div>
                          </div>
                          <div className="badge bg-success">Active</div>
                        </div>
                        <div className="fs-4 fw-bold">$45,234.00</div>
                        <div className="text-success small">
                          <i className="bx bx-trending-up"></i> +2.5%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="crypto-card-float mt-4" style={{ animation: 'float 6s ease-in-out infinite 1s', marginLeft: '2rem' }}>
                    <div className="card border-0 shadow-lg">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center gap-3">
                            <img src="/assets/img/coins/eth.svg" alt="ETH" style={{ width: '40px', height: '40px' }} />
                            <div>
                              <div className="fw-semibold">Ethereum</div>
                              <small className="text-muted">ETH</small>
                            </div>
                          </div>
                          <div className="badge bg-success">Active</div>
                        </div>
                        <div className="fs-4 fw-bold">$2,845.00</div>
                        <div className="text-success small">
                          <i className="bx bx-trending-up"></i> +1.8%
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="crypto-card-float mt-4" style={{ animation: 'float 6s ease-in-out infinite 2s' }}>
                    <div className="card border-0 shadow-lg">
                      <div className="card-body p-4">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <div className="d-flex align-items-center gap-3">
                            <img src="/assets/img/coins/usdterc20.svg" alt="USDT" style={{ width: '40px', height: '40px' }} />
                            <div>
                              <div className="fw-semibold">Tether</div>
                              <small className="text-muted">USDT</small>
                            </div>
                          </div>
                          <div className="badge bg-success">Active</div>
                        </div>
                        <div className="fs-4 fw-bold">$1.00</div>
                        <div className="text-muted small">
                          <i className="bx bx-minus"></i> 0.0%
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="position-relative" style={{ background: '#ffffff', paddingTop: '6rem', paddingBottom: '6rem' }}>
        {/* Decorative elements */}
        <div className="position-absolute" style={{ top: '10%', right: '5%', width: '100px', height: '100px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
        <div className="position-absolute" style={{ bottom: '10%', left: '5%', width: '150px', height: '150px', background: 'rgba(251, 191, 36, 0.1)', borderRadius: '50%', filter: 'blur(60px)' }}></div>
        
        <div className="container-xxl py-5 position-relative">
          <div className="row justify-content-center mb-5">
            <div className="col-lg-8 text-center">
              <h2 className="display-5 fw-bold mb-3">How It Works</h2>
              <p className="text-muted fs-6 mb-0">Accepting crypto payments through BULL PAY is simple. Here's how our payment platform works</p>
            </div>
          </div>

          <div className="row g-4">
            {/* Step 1 */}
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm hover-lift">
                <div className="card-body p-5">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', boxShadow: '0 10px 30px rgba(251, 191, 36, 0.3)' }}>
                    <span className="fs-3 fw-bold text-white">1</span>
                  </div>
                  <h4 className="card-title text-center fw-bold mb-3">Customer selects crypto</h4>
                  <p className="card-text text-muted text-center mb-0 fs-6">At checkout, the buyer chooses to pay with cryptocurrency</p>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm hover-lift">
                <div className="card-body p-5">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', boxShadow: '0 10px 30px rgba(251, 191, 36, 0.3)' }}>
                    <span className="fs-3 fw-bold text-white">2</span>
                  </div>
                  <h4 className="card-title text-center fw-bold mb-3">Payment request is generated</h4>
                  <p className="card-text text-muted text-center mb-0 fs-6">Our system creates a unique payment invoice</p>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm hover-lift">
                <div className="card-body p-5">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', boxShadow: '0 10px 30px rgba(251, 191, 36, 0.3)' }}>
                    <span className="fs-3 fw-bold text-white">3</span>
                  </div>
                  <h4 className="card-title text-center fw-bold mb-3">Transaction is processed via blockchain</h4>
                  <p className="card-text text-muted text-center mb-0 fs-6">Funds are transferred securely through a decentralized network</p>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm hover-lift">
                <div className="card-body p-5">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', boxShadow: '0 10px 30px rgba(251, 191, 36, 0.3)' }}>
                    <span className="fs-3 fw-bold text-white">4</span>
                  </div>
                  <h4 className="card-title text-center fw-bold mb-3">Instant confirmation</h4>
                  <p className="card-text text-muted text-center mb-0 fs-6">Blockchain validates the payment, ensuring fast and transparent transactions</p>
                </div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm hover-lift">
                <div className="card-body p-5">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', boxShadow: '0 10px 30px rgba(251, 191, 36, 0.3)' }}>
                    <span className="fs-3 fw-bold text-white">5</span>
                  </div>
                  <h4 className="card-title text-center fw-bold mb-3">Funds settlement</h4>
                  <p className="card-text text-muted text-center mb-0 fs-6">You receive payments in crypto or convert them to fiat automatically</p>
                </div>
              </div>
            </div>

            {/* Step 6 */}
            <div className="col-md-6 col-lg-4">
              <div className="card h-100 border-0 shadow-sm hover-lift">
                <div className="card-body p-5">
                  <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', boxShadow: '0 10px 30px rgba(251, 191, 36, 0.3)' }}>
                    <span className="fs-3 fw-bold text-white">6</span>
                  </div>
                  <h4 className="card-title text-center fw-bold mb-3">Track and manage transactions</h4>
                  <p className="card-text text-muted text-center mb-0 fs-6">Monitor all payments via your dashboard</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="position-relative overflow-hidden" style={{ background: '#f8f9fa', paddingTop: '6rem', paddingBottom: '6rem' }}>
        {/* Background decoration */}
        <div className="position-absolute w-100 h-100" style={{ opacity: 0.4 }}>
          <div className="position-absolute" style={{ top: '10%', right: '5%', width: '200px', height: '200px', background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)', filter: 'blur(60px)' }}></div>
          <div className="position-absolute" style={{ bottom: '10%', left: '5%', width: '250px', height: '250px', background: 'radial-gradient(circle, #fbbf24 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
        </div>

        <div className="container-xxl py-5 position-relative">
          <div className="row justify-content-center mb-5">
            <div className="col-lg-8 text-center">
              <h2 className="display-5 fw-bold mb-3">What you get with us</h2>
              <p className="text-muted fs-6 mb-0">
                Partnering with BULL PAY means unlocking a robust crypto payment for e-commerce solution designed for seamless integration, security, and efficiency
              </p>
            </div>
          </div>

          <div className="row g-4">
            {/* Feature 1 - Fast & Secure */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100 hover-lift" style={{ borderRadius: '1rem', background: '#ffffff' }}>
                <div className="card-body p-4 p-lg-5">
                  <h3 className="fw-bold mb-3">Fast & secure transactions</h3>
                  <p className="text-muted mb-4">
                    Accept crypto payments with near-instant confirmations. Our advanced blockchain technology ensures maximum security, eliminating chargebacks and fraud risks
                  </p>
                  
                  {/* Visual - Crypto Icons Grid */}
                  <div className="row g-3 mt-4">
                    <div className="col-4">
                      <div className="text-center p-3 rounded" style={{ background: '#f8f9fa' }}>
                        <img src="/assets/img/coins/btc.svg" alt="BTC" style={{ width: '40px', height: '40px' }} />
                        <div className="small fw-semibold mt-2">Bitcoin</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-center p-3 rounded" style={{ background: '#f8f9fa' }}>
                        <img src="/assets/img/coins/eth.svg" alt="ETH" style={{ width: '40px', height: '40px' }} />
                        <div className="small fw-semibold mt-2">Ethereum</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-center p-3 rounded" style={{ background: '#f8f9fa' }}>
                        <img src="/assets/img/coins/usdterc20.svg" alt="USDT" style={{ width: '40px', height: '40px' }} />
                        <div className="small fw-semibold mt-2">Tether</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-center p-3 rounded" style={{ background: '#f8f9fa' }}>
                        <img src="/assets/img/coins/sol.svg" alt="SOL" style={{ width: '40px', height: '40px' }} />
                        <div className="small fw-semibold mt-2">Solana</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-center p-3 rounded" style={{ background: '#f8f9fa' }}>
                        <img src="/assets/img/coins/bnb.svg" alt="BNB" style={{ width: '40px', height: '40px' }} />
                        <div className="small fw-semibold mt-2">BNB</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="text-center p-3 rounded" style={{ background: '#f8f9fa' }}>
                        <img src="/assets/img/coins/ada.svg" alt="ADA" style={{ width: '40px', height: '40px' }} />
                        <div className="small fw-semibold mt-2">Cardano</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 - Global Reach */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100 hover-lift" style={{ borderRadius: '1rem', background: '#ffffff' }}>
                <div className="card-body p-4 p-lg-5">
                  <h3 className="fw-bold mb-3">Global reach & multi-currency support</h3>
                  <p className="text-muted mb-4">
                    Accept Bitcoin, Ethereum, stablecoins, and other cryptocurrencies to reach customers worldwide and make transactions easier
                  </p>
                  
                  {/* Visual - More Crypto Icons */}
                  <div className="row g-3 mt-4">
                    <div className="col-4">
                      <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: '#f8f9fa' }}>
                        <img src="/assets/img/coins/xrp.svg" alt="XRP" style={{ width: '32px', height: '32px' }} />
                        <div className="small fw-semibold">XRP</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: '#f8f9fa' }}>
                        <img src="/assets/img/coins/doge.svg" alt="DOGE" style={{ width: '32px', height: '32px' }} />
                        <div className="small fw-semibold">DOGE</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: '#f8f9fa' }}>
                        <img src="/assets/img/coins/ltc.svg" alt="LTC" style={{ width: '32px', height: '32px' }} />
                        <div className="small fw-semibold">LTC</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: '#f8f9fa' }}>
                        <img src="/assets/img/coins/dot.svg" alt="DOT" style={{ width: '32px', height: '32px' }} />
                        <div className="small fw-semibold">DOT</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: '#f8f9fa' }}>
                        <img src="/assets/img/coins/matic.svg" alt="MATIC" style={{ width: '32px', height: '32px' }} />
                        <div className="small fw-semibold">MATIC</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: '#f8f9fa' }}>
                        <img src="/assets/img/coins/avax.svg" alt="AVAX" style={{ width: '32px', height: '32px' }} />
                        <div className="small fw-semibold">AVAX</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 - Low Costs */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100 hover-lift" style={{ borderRadius: '1rem', background: '#ffffff' }}>
                <div className="card-body p-4 p-lg-5">
                  <h3 className="fw-bold mb-3">Low transaction costs</h3>
                  <p className="text-muted mb-4">
                    Lower fees than traditional payment systems, so businesses keep more of their revenue
                  </p>
                  
                  {/* Visual - Fee Comparison */}
                  <div className="mt-4 p-4 rounded" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' }}>
                    <div className="row text-white">
                      <div className="col-6 text-center">
                        <div className="display-4 fw-bold">0.5%</div>
                        <div className="small">BULL PAY Fee</div>
                      </div>
                      <div className="col-6 text-center">
                        <div className="display-4 fw-bold text-white-50">2.9%</div>
                        <div className="small">Traditional Fee</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 4 - Analytics */}
            <div className="col-lg-6">
              <div className="card border-0 shadow-sm h-100 hover-lift" style={{ borderRadius: '1rem', background: '#ffffff' }}>
                <div className="card-body p-4 p-lg-5">
                  <h3 className="fw-bold mb-3">Transparent & real-time analytics</h3>
                  <p className="text-muted mb-4">
                    Monitor transactions, generate reports, and track revenue from an intuitive dashboard
                  </p>
                  
                  {/* Visual - Dashboard Preview */}
                  <div className="mt-4 p-4 rounded" style={{ background: '#f8f9fa' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <div>
                        <div className="small text-muted">Total Balance</div>
                        <div className="h4 fw-bold mb-0">$45,234.00</div>
                      </div>
                      <div className="badge bg-success">+12.5%</div>
                    </div>
                    <div className="progress mb-3" style={{ height: '8px' }}>
                      <div className="progress-bar bg-warning" style={{ width: '75%' }}></div>
                    </div>
                    <div className="row g-2 small">
                      <div className="col-6">
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-warning" style={{ width: '8px', height: '8px' }}></div>
                          <span className="text-muted">Completed</span>
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="d-flex align-items-center gap-2">
                          <div className="rounded-circle bg-secondary" style={{ width: '8px', height: '8px' }}></div>
                          <span className="text-muted">Pending</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How to Start */}
      <section className="position-relative" style={{ background: '#ffffff', paddingTop: '6rem', paddingBottom: '6rem' }}>
        {/* Decorative grid pattern */}
        <div className="position-absolute w-100 h-100" style={{ opacity: 0.03, backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
        
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
                  <i className="bx bx-user-circle" style={{ fontSize: '3rem', color: '#ef4444' }}></i>
                </div>
                <h5 className="fw-bold mb-2" style={{ color: '#ef4444' }}>Sign Up</h5>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Cryptocurrencies */}
      <section id="currencies" className="position-relative" style={{ background: '#f8f9fa', paddingTop: '6rem', paddingBottom: '6rem' }}>
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
            {cryptoList.map((crypto, idx) => (
              <div key={idx} className="col-6 col-sm-4 col-md-3 col-lg-2">
                <div className="card text-center border hover-lift h-100" style={{ borderColor: '#e5e7eb !important', transition: 'all 0.3s ease' }}>
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
              <button className="btn btn-outline-dark btn-lg px-5 py-3 d-inline-flex align-items-center gap-2">
                <span className="fw-semibold">View All Currencies</span>
                <i className="bx bx-right-arrow-alt fs-5"></i>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-5 bg-white border-top">
        <div className="container-xxl">
          <div className="row g-4 py-4">
            <div className="col-lg-4">
              <div className="d-flex align-items-center mb-3">
                <i className="bx bxs-wallet-alt fs-2 text-warning me-2"></i>
                <span className="fw-bold fs-4">
                  <span className="text-dark">BULL</span>
                  <span className="text-warning">PAY</span>
                </span>
              </div>
              <p className="text-muted mb-4">
                Professional cryptocurrency payment gateway for businesses worldwide. Accept 50+ cryptocurrencies with low fees.
              </p>
              <div className="d-flex gap-3">
                <a href="#" className="btn btn-outline-dark btn-sm rounded-circle" style={{ width: '40px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bx bxl-twitter"></i>
                </a>
                <a href="#" className="btn btn-outline-dark btn-sm rounded-circle" style={{ width: '40px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bx bxl-github"></i>
                </a>
                <a href="#" className="btn btn-outline-dark btn-sm rounded-circle" style={{ width: '40px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bx bxl-telegram"></i>
                </a>
                <a href="#" className="btn btn-outline-dark btn-sm rounded-circle" style={{ width: '40px', height: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bx bxl-discord-alt"></i>
                </a>
              </div>
            </div>
            <div className="col-lg-2 col-md-4">
              <h6 className="fw-bold mb-3 text-dark">Product</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="#features" className="text-secondary text-decoration-none">Features</a></li>
                <li className="mb-2"><a href="#currencies" className="text-secondary text-decoration-none">Currencies</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Pricing</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">API Docs</a></li>
              </ul>
            </div>
            <div className="col-lg-2 col-md-4">
              <h6 className="fw-bold mb-3 text-dark">Company</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">About Us</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Blog</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Careers</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Contact</a></li>
              </ul>
            </div>
            <div className="col-lg-2 col-md-4">
              <h6 className="fw-bold mb-3 text-dark">Resources</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Documentation</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Support</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Status</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Community</a></li>
              </ul>
            </div>
            <div className="col-lg-2 col-md-4">
              <h6 className="fw-bold mb-3 text-dark">Legal</h6>
              <ul className="list-unstyled">
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Terms</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Privacy</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Cookies</a></li>
                <li className="mb-2"><a href="#" className="text-secondary text-decoration-none">Licenses</a></li>
              </ul>
            </div>
          </div>
          <hr className="my-4" />
          <div className="d-flex flex-column flex-md-row justify-content-between align-items-center">
            <div className="text-muted small mb-3 mb-md-0">
              &copy; 2025 BULL PAY. All rights reserved.
            </div>
            <div className="d-flex gap-3">
              <img src="/assets/img/coins/btc.svg" alt="BTC" style={{ width: '24px', height: '24px', opacity: 0.5 }} />
              <img src="/assets/img/coins/eth.svg" alt="ETH" style={{ width: '24px', height: '24px', opacity: 0.5 }} />
              <img src="/assets/img/coins/usdterc20.svg" alt="USDT" style={{ width: '24px', height: '24px', opacity: 0.5 }} />
              <img src="/assets/img/coins/sol.svg" alt="SOL" style={{ width: '24px', height: '24px', opacity: 0.5 }} />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
