export default function HeroSection({ navigate }) {
  return (
    <section className="hero-section position-relative overflow-hidden" style={{
      background: 'var(--bs-tertiary-bg)',
      paddingTop: '8rem',
      paddingBottom: '8rem'
    }}>
      {/* Decorative Background Elements */}
      <div className="position-absolute w-100 h-100" style={{ opacity: 0.4 }}>
        <div className="position-absolute" style={{ top: '20%', left: '10%', width: '200px', height: '200px', background: 'radial-gradient(circle, var(--bs-primary) 0%, transparent 70%)', filter: 'blur(60px)' }}></div>
        <div className="position-absolute" style={{ bottom: '20%', right: '10%', width: '250px', height: '250px', background: 'radial-gradient(circle, var(--bs-primary) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
      </div>

      <div className="container-xxl position-relative">
        <div className="row align-items-center">
          <div className="col-lg-6 mb-5 mb-lg-0">
            <div className="badge bg-primary bg-opacity-10 text-primary border border-primary px-3 py-2 mb-4">
              <i className="bx bx-trending-up me-1"></i>
              Trusted by 1000+ Businesses
            </div>
            <h1 className="display-2 fw-bold mb-4" style={{ lineHeight: '1.2' }}>
              Accept Crypto
              <br />
              <span className="text-primary">Payments</span> Today
            </h1>
            <p className="lead text-muted mb-5" style={{ fontSize: '1.25rem' }}>
              Professional cryptocurrency payment gateway supporting 50+ digital currencies.
              Low fees, instant settlement, and enterprise-grade security.
            </p>
            <div className="d-flex gap-3 flex-wrap mb-5">
              <button className="btn btn-primary btn-lg px-5 py-3 fw-semibold shadow" onClick={() => navigate('/register')}>
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
                <div className="text-primary fw-bold fs-2">50+</div>
                <div className="text-muted small">Cryptocurrencies</div>
              </div>
              <div className="col-4">
                <div className="text-primary fw-bold fs-2">0.5%</div>
                <div className="text-muted small">Transaction Fee</div>
              </div>
              <div className="col-4">
                <div className="text-primary fw-bold fs-2">24/7</div>
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
  )
}
