import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './LandingPageV4.css'

export default function LandingPageV4() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', 'light')
    document.body.style.backgroundColor = '#f5f5f9'
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    
    window.addEventListener('scroll', handleScroll)
    
    return () => {
      document.body.style.backgroundColor = ''
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const cryptoList = [
    { name: 'Bitcoin', symbol: 'BTC', img: '/assets/img/coins/btc.svg', color: '#F7931A' },
    { name: 'Ethereum', symbol: 'ETH', img: '/assets/img/coins/eth.svg', color: '#627EEA' },
    { name: 'Tether', symbol: 'USDT', img: '/assets/img/coins/usdterc20.svg', color: '#26A17B' },
    { name: 'Solana', symbol: 'SOL', img: '/assets/img/coins/sol.svg', color: '#14F195' },
    { name: 'BNB', symbol: 'BNB', img: '/assets/img/coins/bnb.svg', color: '#F3BA2F' },
    { name: 'Cardano', symbol: 'ADA', img: '/assets/img/coins/ada.svg', color: '#0033AD' },
    { name: 'Polygon', symbol: 'MATIC', img: '/assets/img/coins/matic.svg', color: '#8247E5' },
    { name: 'Avalanche', symbol: 'AVAX', img: '/assets/img/coins/avax.svg', color: '#E84142' },
  ]

  return (
    <div className="premium-white">
      {/* Animated Background */}
      <div className="pw-background">
        <div className="pw-grid-pattern"></div>
        <div className="pw-gradient-orb orb-1"></div>
        <div className="pw-gradient-orb orb-2"></div>
        <div className="pw-gradient-orb orb-3"></div>
      </div>

      {/* Premium Navigation */}
      <nav className={`pw-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="pw-container">
          <div className="pw-nav-content">
            <div className="pw-brand">
              <div className="pw-brand-icon">
                <svg viewBox="0 0 40 40" fill="none">
                  <circle cx="20" cy="20" r="18" stroke="url(#gradient)" strokeWidth="2"/>
                  <circle cx="20" cy="20" r="8" fill="url(#gradient)"/>
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="40" y2="40">
                      <stop offset="0%" stopColor="#696cff"/>
                      <stop offset="100%" stopColor="#5f61e6"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
              <span className="pw-brand-text">BULLPAY</span>
            </div>
            
            <div className="pw-nav-links">
              <a href="#features" className="pw-nav-link">Features</a>
              <a href="#how" className="pw-nav-link">How it works</a>
              <a href="#crypto" className="pw-nav-link">Cryptocurrencies</a>
            </div>
            
            <div className="pw-nav-actions">
              <button className="pw-btn-ghost" onClick={() => navigate('/login')}>
                Sign in
              </button>
              <button className="pw-btn-primary" onClick={() => navigate('/register')}>
                Get started
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pw-hero">
        <div className="pw-container">
          <div className="pw-hero-grid">
            <div className="pw-hero-content">
              <div className="pw-badge">
                <span className="pw-badge-pulse"></span>
                <span>Trusted by 10,000+ businesses worldwide</span>
              </div>
              
              <h1 className="pw-hero-title">
                The future of
                <span className="pw-title-gradient"> crypto payments</span>
                <br />starts here
              </h1>
              
              <p className="pw-hero-description">
                Accept cryptocurrency payments with enterprise-grade security, instant settlement, 
                and support for 50+ digital currencies. Join the future of finance today.
              </p>
              
              <div className="pw-hero-actions">
                <button className="pw-btn-hero" onClick={() => navigate('/register')}>
                  Start accepting crypto
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7 4L14 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </button>
                <button className="pw-btn-demo">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="2"/>
                    <path d="M8 7L13 10L8 13V7Z" fill="currentColor"/>
                  </svg>
                  Watch demo
                </button>
              </div>
              
              <div className="pw-stats">
                <div className="pw-stat">
                  <div className="pw-stat-value">50+</div>
                  <div className="pw-stat-label">Cryptocurrencies</div>
                </div>
                <div className="pw-stat-divider"></div>
                <div className="pw-stat">
                  <div className="pw-stat-value">0.5%</div>
                  <div className="pw-stat-label">Transaction fee</div>
                </div>
                <div className="pw-stat-divider"></div>
                <div className="pw-stat">
                  <div className="pw-stat-value">99.9%</div>
                  <div className="pw-stat-label">Uptime SLA</div>
                </div>
              </div>
            </div>
            
            <div className="pw-hero-visual">
              <div className="pw-dashboard-card">
                <div className="pw-card-header">
                  <span className="pw-card-title">Payment Dashboard</span>
                  <div className="pw-live-indicator">
                    <span className="pw-live-dot"></span>
                    <span>Live</span>
                  </div>
                </div>
                
                <div className="pw-balance-section">
                  <div className="pw-balance-label">Total Balance</div>
                  <div className="pw-balance-amount">$45,234.00</div>
                  <div className="pw-balance-change positive">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 12V4M8 4L4 8M8 4L12 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                    </svg>
                    +12.5% this month
                  </div>
                </div>
                
                <div className="pw-chart">
                  <svg viewBox="0 0 300 100" className="pw-chart-svg">
                    <defs>
                      <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#696cff"/>
                        <stop offset="100%" stopColor="#5f61e6"/>
                      </linearGradient>
                      <linearGradient id="chartFill" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="rgba(105, 108, 255, 0.2)"/>
                        <stop offset="100%" stopColor="rgba(105, 108, 255, 0)"/>
                      </linearGradient>
                    </defs>
                    <path 
                      d="M 0 80 Q 50 60, 100 70 T 200 50 T 300 40" 
                      fill="none" 
                      stroke="url(#chartGradient)" 
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    <path 
                      d="M 0 80 Q 50 60, 100 70 T 200 50 T 300 40 L 300 100 L 0 100 Z" 
                      fill="url(#chartFill)"
                    />
                  </svg>
                </div>
                
                <div className="pw-transactions">
                  <div className="pw-transaction">
                    <div className="pw-tx-icon">
                      <img src="/assets/img/coins/btc.svg" alt="BTC" />
                    </div>
                    <div className="pw-tx-info">
                      <div className="pw-tx-name">Bitcoin</div>
                      <div className="pw-tx-time">2 minutes ago</div>
                    </div>
                    <div className="pw-tx-amount positive">+$1,234.00</div>
                  </div>
                  
                  <div className="pw-transaction">
                    <div className="pw-tx-icon">
                      <img src="/assets/img/coins/eth.svg" alt="ETH" />
                    </div>
                    <div className="pw-tx-info">
                      <div className="pw-tx-name">Ethereum</div>
                      <div className="pw-tx-time">15 minutes ago</div>
                    </div>
                    <div className="pw-tx-amount positive">+$845.00</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="pw-features" id="features">
        <div className="pw-container">
          <div className="pw-section-header">
            <div className="pw-section-tag">Features</div>
            <h2 className="pw-section-title">Everything you need to succeed</h2>
            <p className="pw-section-subtitle">
              Enterprise-grade features designed for modern businesses
            </p>
          </div>
          
          <div className="pw-features-grid">
            <div className="pw-feature">
              <div className="pw-feature-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 4L4 10L16 16L28 10L16 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 22L16 28L28 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 16L16 22L28 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="pw-feature-title">Multi-Chain Support</h3>
              <p className="pw-feature-desc">
                Accept payments on 10+ blockchain networks with seamless cross-chain compatibility
              </p>
            </div>
            
            <div className="pw-feature">
              <div className="pw-feature-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <rect x="4" y="4" width="24" height="24" rx="4" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 16L15 19L20 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="pw-feature-title">Instant Settlement</h3>
              <p className="pw-feature-desc">
                Real-time transaction processing with zero latency and automatic confirmation
              </p>
            </div>
            
            <div className="pw-feature">
              <div className="pw-feature-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="2"/>
                  <path d="M16 8V16L22 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="pw-feature-title">24/7 Monitoring</h3>
              <p className="pw-feature-desc">
                Round-the-clock security monitoring with instant fraud detection
              </p>
            </div>
            
            <div className="pw-feature">
              <div className="pw-feature-icon">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 4V28M4 16H28" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="16" cy="16" r="8" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="pw-feature-title">Auto Convert</h3>
              <p className="pw-feature-desc">
                Automatic conversion to your preferred currency with minimal fees
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="pw-how" id="how">
        <div className="pw-container">
          <div className="pw-section-header">
            <div className="pw-section-tag">Process</div>
            <h2 className="pw-section-title">Get started in minutes</h2>
            <p className="pw-section-subtitle">
              Simple integration process with powerful results
            </p>
          </div>
          
          <div className="pw-steps">
            <div className="pw-step">
              <div className="pw-step-number">01</div>
              <div className="pw-step-content">
                <h3 className="pw-step-title">Create Account</h3>
                <p className="pw-step-desc">
                  Sign up and complete verification in under 5 minutes
                </p>
              </div>
            </div>
            
            <div className="pw-step-connector"></div>
            
            <div className="pw-step">
              <div className="pw-step-number">02</div>
              <div className="pw-step-content">
                <h3 className="pw-step-title">Configure Wallet</h3>
                <p className="pw-step-desc">
                  Set up your crypto wallet addresses for receiving payments
                </p>
              </div>
            </div>
            
            <div className="pw-step-connector"></div>
            
            <div className="pw-step">
              <div className="pw-step-number">03</div>
              <div className="pw-step-content">
                <h3 className="pw-step-title">Integrate API</h3>
                <p className="pw-step-desc">
                  Connect our powerful API to your platform
                </p>
              </div>
            </div>
            
            <div className="pw-step-connector"></div>
            
            <div className="pw-step">
              <div className="pw-step-number">04</div>
              <div className="pw-step-content">
                <h3 className="pw-step-title">Go Live</h3>
                <p className="pw-step-desc">
                  Start accepting crypto payments from customers worldwide
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cryptocurrencies */}
      <section className="pw-crypto" id="crypto">
        <div className="pw-container">
          <div className="pw-section-header">
            <div className="pw-section-tag">Cryptocurrencies</div>
            <h2 className="pw-section-title">50+ cryptocurrencies supported</h2>
            <p className="pw-section-subtitle">
              Accept payments in all major digital currencies
            </p>
          </div>
          
          <div className="pw-crypto-grid">
            {cryptoList.map((crypto, idx) => (
              <div key={idx} className="pw-crypto-card">
                <div className="pw-crypto-icon" style={{ '--crypto-color': crypto.color }}>
                  <img src={crypto.img} alt={crypto.symbol} />
                </div>
                <div className="pw-crypto-info">
                  <div className="pw-crypto-name">{crypto.name}</div>
                  <div className="pw-crypto-symbol">{crypto.symbol}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="pw-crypto-cta">
            <button className="pw-btn-outline">
              View all cryptocurrencies
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="pw-cta">
        <div className="pw-container">
          <div className="pw-cta-card">
            <div className="pw-cta-content">
              <h2 className="pw-cta-title">Ready to transform your business?</h2>
              <p className="pw-cta-subtitle">
                Join thousands of businesses already using BULLPAY
              </p>
              <button className="pw-btn-cta" onClick={() => navigate('/register')}>
                Get started for free
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7 4L14 10L7 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pw-footer">
        <div className="pw-container">
          <div className="pw-footer-content">
            <div className="pw-footer-brand">
              <div className="pw-brand">
                <div className="pw-brand-icon">
                  <svg viewBox="0 0 40 40" fill="none">
                    <circle cx="20" cy="20" r="18" stroke="url(#gradient2)" strokeWidth="2"/>
                    <circle cx="20" cy="20" r="8" fill="url(#gradient2)"/>
                    <defs>
                      <linearGradient id="gradient2" x1="0" y1="0" x2="40" y2="40">
                        <stop offset="0%" stopColor="#696cff"/>
                        <stop offset="100%" stopColor="#5f61e6"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
                <span className="pw-brand-text">BULLPAY</span>
              </div>
              <p className="pw-footer-desc">
                The next-generation cryptocurrency payment gateway for modern businesses
              </p>
            </div>
            
            <div className="pw-footer-links">
              <div className="pw-footer-col">
                <h6>Product</h6>
                <a href="#features">Features</a>
                <a href="#how">How it works</a>
                <a href="#crypto">Cryptocurrencies</a>
              </div>
              
              <div className="pw-footer-col">
                <h6>Company</h6>
                <a href="#">About us</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
              </div>
              
              <div className="pw-footer-col">
                <h6>Legal</h6>
                <a href="#">Terms of service</a>
                <a href="#">Privacy policy</a>
                <a href="#">Security</a>
              </div>
            </div>
          </div>
          
          <div className="pw-footer-bottom">
            <p>&copy; 2025 BULLPAY. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
