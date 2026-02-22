export default function FeaturesSection() {
  return (
    <section id="features" className="position-relative overflow-hidden" style={{ background: 'var(--bs-tertiary-bg)', paddingTop: '6rem', paddingBottom: '6rem' }}>
      {/* Background decoration */}
      <div className="position-absolute w-100 h-100" style={{ opacity: 0.4 }}>
        <div className="position-absolute" style={{ top: '10%', right: '5%', width: '200px', height: '200px', background: 'radial-gradient(circle, var(--bs-primary) 0%, transparent 70%)', filter: 'blur(60px)' }}></div>
        <div className="position-absolute" style={{ bottom: '10%', left: '5%', width: '250px', height: '250px', background: 'radial-gradient(circle, var(--bs-primary) 0%, transparent 70%)', filter: 'blur(80px)' }}></div>
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
            <div className="card border-0 shadow-sm h-100 hover-lift" style={{ borderRadius: '1rem', background: 'var(--bs-body-bg)' }}>
              <div className="card-body p-4 p-lg-5">
                <h3 className="fw-bold mb-3">Fast & secure transactions</h3>
                <p className="text-muted mb-4">
                  Accept crypto payments with near-instant confirmations. Our advanced blockchain technology ensures maximum security, eliminating chargebacks and fraud risks
                </p>

                {/* Visual - Crypto Icons Grid */}
                <div className="row g-3 mt-4">
                  <div className="col-4">
                    <div className="text-center p-3 rounded" style={{ background: 'var(--bs-tertiary-bg)' }}>
                      <img src="/assets/img/coins/btc.svg" alt="BTC" style={{ width: '40px', height: '40px' }} />
                      <div className="small fw-semibold mt-2">Bitcoin</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-3 rounded" style={{ background: 'var(--bs-tertiary-bg)' }}>
                      <img src="/assets/img/coins/eth.svg" alt="ETH" style={{ width: '40px', height: '40px' }} />
                      <div className="small fw-semibold mt-2">Ethereum</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-3 rounded" style={{ background: 'var(--bs-tertiary-bg)' }}>
                      <img src="/assets/img/coins/usdterc20.svg" alt="USDT" style={{ width: '40px', height: '40px' }} />
                      <div className="small fw-semibold mt-2">Tether</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-3 rounded" style={{ background: 'var(--bs-tertiary-bg)' }}>
                      <img src="/assets/img/coins/sol.svg" alt="SOL" style={{ width: '40px', height: '40px' }} />
                      <div className="small fw-semibold mt-2">Solana</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-3 rounded" style={{ background: 'var(--bs-tertiary-bg)' }}>
                      <img src="/assets/img/coins/bnb.svg" alt="BNB" style={{ width: '40px', height: '40px' }} />
                      <div className="small fw-semibold mt-2">BNB</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="text-center p-3 rounded" style={{ background: 'var(--bs-tertiary-bg)' }}>
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
            <div className="card border-0 shadow-sm h-100 hover-lift" style={{ borderRadius: '1rem', background: 'var(--bs-body-bg)' }}>
              <div className="card-body p-4 p-lg-5">
                <h3 className="fw-bold mb-3">Global reach & multi-currency support</h3>
                <p className="text-muted mb-4">
                  Accept Bitcoin, Ethereum, stablecoins, and other cryptocurrencies to reach customers worldwide and make transactions easier
                </p>

                {/* Visual - More Crypto Icons */}
                <div className="row g-3 mt-4">
                  <div className="col-4">
                    <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: 'var(--bs-tertiary-bg)' }}>
                      <img src="/assets/img/coins/xrp.svg" alt="XRP" style={{ width: '32px', height: '32px' }} />
                      <div className="small fw-semibold">XRP</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: 'var(--bs-tertiary-bg)' }}>
                      <img src="/assets/img/coins/doge.svg" alt="DOGE" style={{ width: '32px', height: '32px' }} />
                      <div className="small fw-semibold">DOGE</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: 'var(--bs-tertiary-bg)' }}>
                      <img src="/assets/img/coins/ltc.svg" alt="LTC" style={{ width: '32px', height: '32px' }} />
                      <div className="small fw-semibold">LTC</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: 'var(--bs-tertiary-bg)' }}>
                      <img src="/assets/img/coins/dot.svg" alt="DOT" style={{ width: '32px', height: '32px' }} />
                      <div className="small fw-semibold">DOT</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: 'var(--bs-tertiary-bg)' }}>
                      <img src="/assets/img/coins/matic.svg" alt="MATIC" style={{ width: '32px', height: '32px' }} />
                      <div className="small fw-semibold">MATIC</div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="d-flex align-items-center gap-2 p-2 rounded" style={{ background: 'var(--bs-tertiary-bg)' }}>
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
            <div className="card border-0 shadow-sm h-100 hover-lift" style={{ borderRadius: '1rem', background: 'var(--bs-body-bg)' }}>
              <div className="card-body p-4 p-lg-5">
                <h3 className="fw-bold mb-3">Low transaction costs</h3>
                <p className="text-muted mb-4">
                  Lower fees than traditional payment systems, so businesses keep more of their revenue
                </p>

                {/* Visual - Fee Comparison */}
                <div className="mt-4 p-4 rounded" style={{ background: 'linear-gradient(135deg, var(--bs-primary) 0%, color-mix(in srgb, var(--bs-primary), #000 10%) 100%)' }}>
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
            <div className="card border-0 shadow-sm h-100 hover-lift" style={{ borderRadius: '1rem', background: 'var(--bs-body-bg)' }}>
              <div className="card-body p-4 p-lg-5">
                <h3 className="fw-bold mb-3">Transparent & real-time analytics</h3>
                <p className="text-muted mb-4">
                  Monitor transactions, generate reports, and track revenue from an intuitive dashboard
                </p>

                {/* Visual - Dashboard Preview */}
                <div className="mt-4 p-4 rounded" style={{ background: 'var(--bs-tertiary-bg)' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <div className="small text-muted">Total Balance</div>
                      <div className="h4 fw-bold mb-0">$45,234.00</div>
                    </div>
                    <div className="badge bg-success">+12.5%</div>
                  </div>
                  <div className="progress mb-3" style={{ height: '8px' }}>
                    <div className="progress-bar bg-primary" style={{ width: '75%' }}></div>
                  </div>
                  <div className="row g-2 small">
                    <div className="col-6">
                      <div className="d-flex align-items-center gap-2">
                        <div className="rounded-circle bg-primary" style={{ width: '8px', height: '8px' }}></div>
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
  )
}
