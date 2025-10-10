import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './LandingPageV2.css'

export default function LandingPageV2() {
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', 'light')
    document.body.style.backgroundColor = '#ffffff'
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
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

  const features = [
    {
      icon: 'bx-shield-alt',
      title: 'Enterprise Security',
      desc: 'Bank-grade encryption with multi-signature wallets and cold storage',
      color: '#3B82F6'
    },
    {
      icon: 'bx-bolt',
      title: 'Instant Settlement',
      desc: 'Real-time processing with automatic conversion to your preferred currency',
      color: '#10B981'
    },
    {
      icon: 'bx-dollar-circle',
      title: 'Lowest Fees',
      desc: 'Only 0.5% per transaction with no hidden costs or monthly fees',
      color: '#F59E0B'
    },
    {
      icon: 'bx-support',
      title: '24/7 Support',
      desc: 'Dedicated support team available around the clock via chat and email',
      color: '#8B5CF6'
    }
  ]

  return (
    <div className="landing-pro">
      {/* Premium Navigation */}
      <nav className={`nav-pro ${scrolled ? 'scrolled' : ''}`}>
        <div className="container-pro">
          <div className="nav-content-pro">
            <div className="nav-brand-pro">
              <div className="brand-icon-pro">
                <i className="bx bxs-wallet-alt"></i>
              </div>
              <span className="brand-name-pro">BULLPAY</span>
            </div>
            
            <div className="nav-menu-pro">
              <a href="#features" className="nav-link-pro">Features</a>
              <a href="#how" className="nav-link-pro">How it works</a>
              <a href="#pricing" className="nav-link-pro">Pricing</a>
              <a href="#crypto" className="nav-link-pro">Cryptocurrencies</a>
            </div>
            
            <div className="nav-actions-pro">
              <button className="btn-secondary-pro" onClick={() => navigate('/login')}>
                Sign in
              </button>
              <button className="btn-primary-pro" onClick={() => navigate('/register')}>
                Get started
                <i className="bx bx-right-arrow-alt"></i>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Premium */}
      <section className="hero-pro">
        <div className="hero-bg-pro">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="grid-pattern"></div>
        </div>
        
        <div className="container-pro">
          <div className="hero-content-pro">
            <div className="hero-text-pro">
              <div className="hero-badge-pro">
                <span className="badge-dot"></span>
                <span>Trusted by 1,000+ businesses worldwide</span>
              </div>
              
              <h1 className="hero-title-pro">
                The modern<br />
                way to accept<br />
                <span className="text-gradient-pro">crypto payments</span>
              </h1>
              
              <p className="hero-subtitle-pro">
                Integrate cryptocurrency payments into your business in minutes.
                Support 50+ digital currencies with instant settlement and industry-leading security.
              </p>
              
              <div className="hero-cta-pro">
                <button className="btn-hero-primary-pro" onClick={() => navigate('/register')}>
                  Start accepting crypto
                  <i className="bx bx-right-arrow-alt"></i>
                </button>
                <button className="btn-hero-secondary-pro">
                  <i className="bx bx-play-circle"></i>
                  Watch demo
                </button>
              </div>
              
              <div className="hero-metrics-pro">
                <div className="metric-pro">
                  <div className="metric-value-pro">50+</div>
                  <div className="metric-label-pro">Cryptocurrencies</div>
                </div>
                <div className="metric-divider-pro"></div>
                <div className="metric-pro">
                  <div className="metric-value-pro">0.5%</div>
                  <div className="metric-label-pro">Transaction fee</div>
                </div>
                <div className="metric-divider-pro"></div>
                <div className="metric-pro">
                  <div className="metric-value-pro">$50M+</div>
                  <div className="metric-label-pro">Processed</div>
                </div>
              </div>
            </div>
            
            <div className="hero-visual-pro">
              <div className="dashboard-card-pro">
                <div className="card-header-pro">
                  <div className="card-dots-pro">
                    <span></span><span></span><span></span>
                  </div>
                  <span className="card-title-pro">Payment Dashboard</span>
                  <div className="card-status-pro">
                    <span className="status-dot-pro"></span>
                    <span>Live</span>
                  </div>
                </div>
                
                <div className="card-body-pro">
                  <div className="balance-section-pro">
                    <div className="balance-label-pro">Total Balance</div>
                    <div className="balance-amount-pro">$45,234.00</div>
                    <div className="balance-change-pro positive">
                      <i className="bx bx-trending-up"></i>
                      <span>+12.5% this month</span>
                    </div>
                  </div>
                  
                  <div className="chart-placeholder-pro">
                    <svg viewBox="0 0 300 100" className="mini-chart-pro">
                      <path d="M 0 80 Q 50 60, 100 70 T 200 50 T 300 30" fill="none" stroke="url(#gradient)" strokeWidth="2"/>
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#fbbf24" />
                          <stop offset="100%" stopColor="#f59e0b" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  
                  <div className="transactions-pro">
                    <div className="tx-header-pro">Recent Transactions</div>
                    <div className="tx-list-pro">
                      <div className="tx-item-pro">
                        <div className="tx-icon-pro">
                          <img src="/assets/img/coins/btc.svg" alt="BTC" />
                        </div>
                        <div className="tx-details-pro">
                          <div className="tx-name-pro">Bitcoin</div>
                          <div className="tx-time-pro">2 min ago</div>
                        </div>
                        <div className="tx-amount-pro positive">+$1,234.00</div>
                      </div>
                      
                      <div className="tx-item-pro">
                        <div className="tx-icon-pro">
                          <img src="/assets/img/coins/eth.svg" alt="ETH" />
                        </div>
                        <div className="tx-details-pro">
                          <div className="tx-name-pro">Ethereum</div>
                          <div className="tx-time-pro">15 min ago</div>
                        </div>
                        <div className="tx-amount-pro positive">+$845.00</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="floating-card-pro card-1">
                <div className="mini-stat-pro">
                  <i className="bx bx-trending-up"></i>
                  <div>
                    <div className="mini-stat-value-pro">+24%</div>
                    <div className="mini-stat-label-pro">Growth</div>
                  </div>
                </div>
              </div>
              
              <div className="floating-card-pro card-2">
                <div className="mini-stat-pro">
                  <i className="bx bx-check-circle"></i>
                  <div>
                    <div className="mini-stat-value-pro">99.9%</div>
                    <div className="mini-stat-label-pro">Uptime</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid - Professional */}
      <section className="features-pro" id="features">
        <div className="container-pro">
          <div className="section-header-pro">
            <div className="section-badge-pro">Features</div>
            <h2 className="section-title-pro">Everything you need to succeed</h2>
            <p className="section-subtitle-pro">
              Powerful features designed for modern businesses
            </p>
          </div>
          
          <div className="features-grid-pro">
            {features.map((feature, idx) => (
              <div 
                key={idx} 
                className="feature-card-pro"
                onMouseEnter={() => setActiveFeature(idx)}
              >
                <div className="feature-icon-pro" style={{ background: `${feature.color}15` }}>
                  <i className={`bx ${feature.icon}`} style={{ color: feature.color }}></i>
                </div>
                <h3 className="feature-title-pro">{feature.title}</h3>
                <p className="feature-desc-pro">{feature.desc}</p>
                <div className="feature-arrow-pro">
                  <i className="bx bx-right-arrow-alt"></i>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Step by Step */}
      <section className="how-works-pro" id="how">
        <div className="container-pro">
          <div className="section-header-pro">
            <div className="section-badge-pro">How it works</div>
            <h2 className="section-title-pro">Get started in minutes</h2>
            <p className="section-subtitle-pro">
              Simple integration process with no technical expertise required
            </p>
          </div>
          
          <div className="steps-container-pro">
            <div className="step-pro">
              <div className="step-number-pro">01</div>
              <div className="step-content-pro">
                <h3 className="step-title-pro">Create your account</h3>
                <p className="step-desc-pro">
                  Sign up in seconds and complete our simple verification process
                </p>
              </div>
              <div className="step-visual-pro">
                <div className="step-icon-pro">
                  <i className="bx bx-user-plus"></i>
                </div>
              </div>
            </div>
            
            <div className="step-connector-pro"></div>
            
            <div className="step-pro">
              <div className="step-number-pro">02</div>
              <div className="step-content-pro">
                <h3 className="step-title-pro">Configure your wallet</h3>
                <p className="step-desc-pro">
                  Set up your crypto wallet addresses to receive payments
                </p>
              </div>
              <div className="step-visual-pro">
                <div className="step-icon-pro">
                  <i className="bx bx-wallet"></i>
                </div>
              </div>
            </div>
            
            <div className="step-connector-pro"></div>
            
            <div className="step-pro">
              <div className="step-number-pro">03</div>
              <div className="step-content-pro">
                <h3 className="step-title-pro">Integrate our API</h3>
                <p className="step-desc-pro">
                  Connect our simple API to your website or application
                </p>
              </div>
              <div className="step-visual-pro">
                <div className="step-icon-pro">
                  <i className="bx bx-code-alt"></i>
                </div>
              </div>
            </div>
            
            <div className="step-connector-pro"></div>
            
            <div className="step-pro">
              <div className="step-number-pro">04</div>
              <div className="step-content-pro">
                <h3 className="step-title-pro">Start accepting payments</h3>
                <p className="step-desc-pro">
                  Begin receiving crypto payments from customers worldwide
                </p>
              </div>
              <div className="step-visual-pro">
                <div className="step-icon-pro">
                  <i className="bx bx-check-circle"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Cryptocurrencies */}
      <section className="crypto-section-pro" id="crypto">
        <div className="container-pro">
          <div className="section-header-pro">
            <div className="section-badge-pro">Cryptocurrencies</div>
            <h2 className="section-title-pro">50+ cryptocurrencies supported</h2>
            <p className="section-subtitle-pro">
              Accept payments in all major digital currencies
            </p>
          </div>
          
          <div className="crypto-grid-pro">
            {cryptoList.map((crypto, idx) => (
              <div key={idx} className="crypto-card-pro">
                <div className="crypto-icon-wrapper-pro" style={{ background: `${crypto.color}15` }}>
                  <img src={crypto.img} alt={crypto.symbol} />
                </div>
                <div className="crypto-info-pro">
                  <div className="crypto-name-pro">{crypto.name}</div>
                  <div className="crypto-symbol-pro">{crypto.symbol}</div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="crypto-cta-pro">
            <button className="btn-outline-pro">
              View all cryptocurrencies
              <i className="bx bx-right-arrow-alt"></i>
            </button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-pro">
        <div className="container-pro">
          <div className="cta-card-pro">
            <div className="cta-content-pro">
              <h2 className="cta-title-pro">Ready to start accepting crypto?</h2>
              <p className="cta-subtitle-pro">
                Join thousands of businesses already using BULLPAY
              </p>
              <div className="cta-buttons-pro">
                <button className="btn-cta-primary-pro" onClick={() => navigate('/register')}>
                  Create free account
                  <i className="bx bx-right-arrow-alt"></i>
                </button>
                <button className="btn-cta-secondary-pro">
                  Schedule a demo
                </button>
              </div>
            </div>
            <div className="cta-visual-pro">
              <div className="cta-stats-pro">
                <div className="cta-stat-pro">
                  <div className="cta-stat-value-pro">1,000+</div>
                  <div className="cta-stat-label-pro">Active businesses</div>
                </div>
                <div className="cta-stat-pro">
                  <div className="cta-stat-value-pro">$50M+</div>
                  <div className="cta-stat-label-pro">Processed volume</div>
                </div>
                <div className="cta-stat-pro">
                  <div className="cta-stat-value-pro">99.9%</div>
                  <div className="cta-stat-label-pro">Uptime</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Professional */}
      <footer className="footer-pro">
        <div className="container-pro">
          <div className="footer-content-pro">
            <div className="footer-brand-section-pro">
              <div className="footer-brand-pro">
                <div className="brand-icon-pro">
                  <i className="bx bxs-wallet-alt"></i>
                </div>
                <span className="brand-name-pro">BULLPAY</span>
              </div>
              <p className="footer-desc-pro">
                The modern cryptocurrency payment gateway for businesses worldwide.
              </p>
              <div className="footer-social-pro">
                <a href="#" className="social-link-pro"><i className="bx bxl-twitter"></i></a>
                <a href="#" className="social-link-pro"><i className="bx bxl-github"></i></a>
                <a href="#" className="social-link-pro"><i className="bx bxl-linkedin"></i></a>
                <a href="#" className="social-link-pro"><i className="bx bxl-telegram"></i></a>
              </div>
            </div>
            
            <div className="footer-links-pro">
              <div className="footer-column-pro">
                <h6 className="footer-heading-pro">Product</h6>
                <a href="#features" className="footer-link-pro">Features</a>
                <a href="#" className="footer-link-pro">Pricing</a>
                <a href="#" className="footer-link-pro">API Documentation</a>
                <a href="#" className="footer-link-pro">Integrations</a>
              </div>
              
              <div className="footer-column-pro">
                <h6 className="footer-heading-pro">Company</h6>
                <a href="#" className="footer-link-pro">About us</a>
                <a href="#" className="footer-link-pro">Blog</a>
                <a href="#" className="footer-link-pro">Careers</a>
                <a href="#" className="footer-link-pro">Contact</a>
              </div>
              
              <div className="footer-column-pro">
                <h6 className="footer-heading-pro">Resources</h6>
                <a href="#" className="footer-link-pro">Documentation</a>
                <a href="#" className="footer-link-pro">Help Center</a>
                <a href="#" className="footer-link-pro">Status</a>
                <a href="#" className="footer-link-pro">Community</a>
              </div>
              
              <div className="footer-column-pro">
                <h6 className="footer-heading-pro">Legal</h6>
                <a href="#" className="footer-link-pro">Terms of Service</a>
                <a href="#" className="footer-link-pro">Privacy Policy</a>
                <a href="#" className="footer-link-pro">Cookie Policy</a>
                <a href="#" className="footer-link-pro">Compliance</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom-pro">
            <p className="footer-copyright-pro">&copy; 2025 BULLPAY. All rights reserved.</p>
            <div className="footer-badges-pro">
              <img src="/assets/img/coins/btc.svg" alt="BTC" />
              <img src="/assets/img/coins/eth.svg" alt="ETH" />
              <img src="/assets/img/coins/usdterc20.svg" alt="USDT" />
              <img src="/assets/img/coins/sol.svg" alt="SOL" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
