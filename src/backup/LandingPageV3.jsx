import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './LandingPageV3.css'

export default function LandingPageV3() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', 'dark')
    document.body.style.backgroundColor = '#000000'
    
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
    <div className="future-landing">
      {/* Animated Background */}
      <div className="future-bg">
        <div className="grid-lines"></div>
        <div className="glow-orb orb-1"></div>
        <div className="glow-orb orb-2"></div>
        <div className="glow-orb orb-3"></div>
        <div className="particles"></div>
      </div>

      {/* Futuristic Nav */}
      <nav className={`future-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="container-future">
          <div className="nav-inner-future">
            <div className="logo-future">
              <div className="logo-glow"></div>
              <span className="logo-text-future">
                <span className="logo-bracket">[</span>
                BULLPAY
                <span className="logo-bracket">]</span>
              </span>
            </div>
            
            <div className="nav-menu-future">
              <a href="#features" className="nav-link-future">
                <span className="link-bracket">&lt;</span>
                Features
                <span className="link-bracket">/&gt;</span>
              </a>
              <a href="#tech" className="nav-link-future">
                <span className="link-bracket">&lt;</span>
                Technology
                <span className="link-bracket">/&gt;</span>
              </a>
              <a href="#crypto" className="nav-link-future">
                <span className="link-bracket">&lt;</span>
                Crypto
                <span className="link-bracket">/&gt;</span>
              </a>
            </div>
            
            <div className="nav-actions-future">
              <button className="btn-ghost-future" onClick={() => navigate('/login')}>
                <span className="btn-text">SIGN IN</span>
                <span className="btn-glow"></span>
              </button>
              <button className="btn-cyber-future" onClick={() => navigate('/register')}>
                <span className="btn-text">GET STARTED</span>
                <span className="btn-glow"></span>
                <i className="bx bx-right-arrow-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero - Futuristic */}
      <section className="hero-future">
        <div className="container-future">
          <div className="hero-content-future">
            <div className="hero-badge-future">
              <span className="badge-pulse"></span>
              <span className="badge-text">NEXT-GEN PAYMENT GATEWAY</span>
            </div>
            
            <h1 className="hero-title-future">
              <span className="title-line">THE FUTURE OF</span>
              <span className="title-line title-gradient">CRYPTO PAYMENTS</span>
              <span className="title-line">IS HERE</span>
            </h1>
            
            <p className="hero-subtitle-future">
              Experience lightning-fast cryptocurrency transactions with our advanced blockchain technology.
              Accept 50+ digital currencies with zero latency and maximum security.
            </p>
            
            <div className="hero-cta-future">
              <button className="btn-primary-future" onClick={() => navigate('/register')}>
                <span className="btn-inner">
                  <span className="btn-text">INITIALIZE SYSTEM</span>
                  <span className="btn-icon">→</span>
                </span>
                <span className="btn-border"></span>
              </button>
              
              <button className="btn-secondary-future">
                <span className="btn-inner">
                  <span className="btn-icon">▶</span>
                  <span className="btn-text">WATCH DEMO</span>
                </span>
              </button>
            </div>
            
            <div className="hero-metrics-future">
              <div className="metric-future">
                <div className="metric-border"></div>
                <div className="metric-content">
                  <div className="metric-value">50+</div>
                  <div className="metric-label">CRYPTOCURRENCIES</div>
                </div>
              </div>
              
              <div className="metric-future">
                <div className="metric-border"></div>
                <div className="metric-content">
                  <div className="metric-value">0.5%</div>
                  <div className="metric-label">TRANSACTION FEE</div>
                </div>
              </div>
              
              <div className="metric-future">
                <div className="metric-border"></div>
                <div className="metric-content">
                  <div className="metric-value">99.9%</div>
                  <div className="metric-label">UPTIME</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hero-visual-future">
            <div className="hologram-card">
              <div className="hologram-border"></div>
              <div className="hologram-content">
                <div className="holo-header">
                  <span className="holo-title">PAYMENT TERMINAL</span>
                  <span className="holo-status">
                    <span className="status-dot"></span>
                    ONLINE
                  </span>
                </div>
                
                <div className="holo-display">
                  <div className="display-value">$45,234.00</div>
                  <div className="display-label">TOTAL BALANCE</div>
                  <div className="display-change">
                    <span className="change-icon">↑</span>
                    <span className="change-value">+12.5%</span>
                  </div>
                </div>
                
                <div className="holo-graph">
                  <svg viewBox="0 0 200 60" className="graph-svg">
                    <defs>
                      <linearGradient id="graphGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00f0ff" />
                        <stop offset="100%" stopColor="#ff00ff" />
                      </linearGradient>
                    </defs>
                    <path d="M 0 50 Q 50 30, 100 35 T 200 20" 
                          fill="none" 
                          stroke="url(#graphGradient)" 
                          strokeWidth="2"/>
                  </svg>
                </div>
                
                <div className="holo-transactions">
                  <div className="tx-future">
                    <img src="/assets/img/coins/btc.svg" alt="BTC" />
                    <div className="tx-info">
                      <span className="tx-name">BITCOIN</span>
                      <span className="tx-time">2 MIN AGO</span>
                    </div>
                    <span className="tx-amount">+$1,234.00</span>
                  </div>
                  
                  <div className="tx-future">
                    <img src="/assets/img/coins/eth.svg" alt="ETH" />
                    <div className="tx-info">
                      <span className="tx-name">ETHEREUM</span>
                      <span className="tx-time">15 MIN AGO</span>
                    </div>
                    <span className="tx-amount">+$845.00</span>
                  </div>
                </div>
              </div>
              <div className="hologram-glow"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Tech Grid */}
      <section className="features-future" id="features">
        <div className="container-future">
          <div className="section-header-future">
            <div className="section-tag">&lt;FEATURES/&gt;</div>
            <h2 className="section-title-future">ADVANCED CAPABILITIES</h2>
            <p className="section-subtitle-future">Powered by next-generation blockchain technology</p>
          </div>
          
          <div className="tech-grid">
            <div className="tech-card">
              <div className="tech-border"></div>
              <div className="tech-icon">
                <i className="bx bx-shield-alt"></i>
              </div>
              <h3 className="tech-title">QUANTUM SECURITY</h3>
              <p className="tech-desc">Military-grade encryption with multi-layer security protocols</p>
              <div className="tech-stats">
                <span className="stat-item">256-BIT ENCRYPTION</span>
                <span className="stat-item">COLD STORAGE</span>
              </div>
            </div>
            
            <div className="tech-card">
              <div className="tech-border"></div>
              <div className="tech-icon">
                <i className="bx bx-bolt"></i>
              </div>
              <h3 className="tech-title">INSTANT PROCESSING</h3>
              <p className="tech-desc">Lightning-fast transactions with zero latency</p>
              <div className="tech-stats">
                <span className="stat-item">&lt;1S CONFIRMATION</span>
                <span className="stat-item">REAL-TIME</span>
              </div>
            </div>
            
            <div className="tech-card">
              <div className="tech-border"></div>
              <div className="tech-icon">
                <i className="bx bx-network-chart"></i>
              </div>
              <h3 className="tech-title">MULTI-CHAIN</h3>
              <p className="tech-desc">Support for 10+ blockchain networks</p>
              <div className="tech-stats">
                <span className="stat-item">50+ COINS</span>
                <span className="stat-item">CROSS-CHAIN</span>
              </div>
            </div>
            
            <div className="tech-card">
              <div className="tech-border"></div>
              <div className="tech-icon">
                <i className="bx bx-trending-up"></i>
              </div>
              <h3 className="tech-title">AUTO CONVERT</h3>
              <p className="tech-desc">Automatic conversion to your preferred currency</p>
              <div className="tech-stats">
                <span className="stat-item">0.5% FEE</span>
                <span className="stat-item">INSTANT</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works - Timeline */}
      <section className="tech-section" id="tech">
        <div className="container-future">
          <div className="section-header-future">
            <div className="section-tag">&lt;PROCESS/&gt;</div>
            <h2 className="section-title-future">INTEGRATION PROTOCOL</h2>
          </div>
          
          <div className="timeline-future">
            <div className="timeline-line"></div>
            
            <div className="timeline-step">
              <div className="step-node">
                <span className="node-number">01</span>
                <div className="node-pulse"></div>
              </div>
              <div className="step-content">
                <h3 className="step-title">INITIALIZE ACCOUNT</h3>
                <p className="step-desc">Create your account and complete verification in under 5 minutes</p>
              </div>
            </div>
            
            <div className="timeline-step">
              <div className="step-node">
                <span className="node-number">02</span>
                <div className="node-pulse"></div>
              </div>
              <div className="step-content">
                <h3 className="step-title">CONFIGURE WALLET</h3>
                <p className="step-desc">Set up your crypto wallet addresses for receiving payments</p>
              </div>
            </div>
            
            <div className="timeline-step">
              <div className="step-node">
                <span className="node-number">03</span>
                <div className="node-pulse"></div>
              </div>
              <div className="step-content">
                <h3 className="step-title">INTEGRATE API</h3>
                <p className="step-desc">Connect our advanced API to your platform</p>
              </div>
            </div>
            
            <div className="timeline-step">
              <div className="step-node">
                <span className="node-number">04</span>
                <div className="node-pulse"></div>
              </div>
              <div className="step-content">
                <h3 className="step-title">GO LIVE</h3>
                <p className="step-desc">Start accepting crypto payments from customers worldwide</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Crypto - Holographic Grid */}
      <section className="crypto-future" id="crypto">
        <div className="container-future">
          <div className="section-header-future">
            <div className="section-tag">&lt;CRYPTOCURRENCIES/&gt;</div>
            <h2 className="section-title-future">SUPPORTED NETWORKS</h2>
          </div>
          
          <div className="crypto-grid-future">
            {cryptoList.map((crypto, idx) => (
              <div key={idx} className="crypto-card-future" style={{'--crypto-color': crypto.color}}>
                <div className="crypto-border-future"></div>
                <div className="crypto-inner">
                  <div className="crypto-icon-future">
                    <img src={crypto.img} alt={crypto.symbol} />
                    <div className="icon-glow"></div>
                  </div>
                  <div className="crypto-info-future">
                    <div className="crypto-name-future">{crypto.name}</div>
                    <div className="crypto-symbol-future">{crypto.symbol}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="crypto-cta-future">
            <button className="btn-outline-future">
              <span className="btn-text">VIEW ALL NETWORKS</span>
              <span className="btn-arrow">→</span>
              <span className="btn-border"></span>
            </button>
          </div>
        </div>
      </section>

      {/* CTA - Cyber */}
      <section className="cta-future">
        <div className="container-future">
          <div className="cta-box-future">
            <div className="cta-border"></div>
            <div className="cta-content">
              <h2 className="cta-title-future">READY TO ENTER THE FUTURE?</h2>
              <p className="cta-subtitle-future">Join the next generation of payment processing</p>
              <button className="btn-cta-future" onClick={() => navigate('/register')}>
                <span className="btn-inner">
                  <span className="btn-text">ACTIVATE ACCOUNT</span>
                  <span className="btn-icon">→</span>
                </span>
                <span className="btn-glow"></span>
              </button>
            </div>
            <div className="cta-glow"></div>
          </div>
        </div>
      </section>

      {/* Footer - Cyber */}
      <footer className="footer-future">
        <div className="container-future">
          <div className="footer-content-future">
            <div className="footer-brand-future">
              <div className="logo-future">
                <div className="logo-glow"></div>
                <span className="logo-text-future">
                  <span className="logo-bracket">[</span>
                  BULLPAY
                  <span className="logo-bracket">]</span>
                </span>
              </div>
              <p className="footer-desc-future">
                Next-generation cryptocurrency payment gateway
              </p>
            </div>
            
            <div className="footer-links-future">
              <div className="footer-col-future">
                <h6>PRODUCT</h6>
                <a href="#features">Features</a>
                <a href="#tech">Technology</a>
                <a href="#crypto">Cryptocurrencies</a>
              </div>
              
              <div className="footer-col-future">
                <h6>COMPANY</h6>
                <a href="#">About</a>
                <a href="#">Blog</a>
                <a href="#">Careers</a>
              </div>
              
              <div className="footer-col-future">
                <h6>LEGAL</h6>
                <a href="#">Terms</a>
                <a href="#">Privacy</a>
                <a href="#">Security</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom-future">
            <p>&copy; 2025 BULLPAY. ALL RIGHTS RESERVED.</p>
            <div className="footer-line"></div>
          </div>
        </div>
      </footer>
    </div>
  )
}
