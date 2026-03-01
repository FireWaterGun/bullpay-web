'use client'

export default function HowItWorksSection() {
  return (
    <section className="position-relative" style={{ background: 'var(--bs-body-bg)', paddingTop: '6rem', paddingBottom: '6rem' }}>
      {/* Decorative elements */}
      <div className="position-absolute" style={{ top: '10%', right: '5%', width: '100px', height: '100px', background: 'rgba(var(--bs-primary-rgb), 0.1)', borderRadius: '50%', filter: 'blur(40px)' }}></div>
      <div className="position-absolute" style={{ bottom: '10%', left: '5%', width: '150px', height: '150px', background: 'rgba(var(--bs-primary-rgb), 0.1)', borderRadius: '50%', filter: 'blur(60px)' }}></div>

      <div className="container-xxl py-5 position-relative">
        <div className="row justify-content-center mb-5">
          <div className="col-lg-8 text-center">
            <h2 className="display-5 fw-bold mb-3">How It Works</h2>
            <p className="text-muted fs-6 mb-0">Accepting crypto payments through BULL PAY is simple. Here&apos;s how our payment platform works</p>
          </div>
        </div>

        <div className="row g-4">
          {/* Step 1 */}
          <div className="col-md-6 col-lg-4">
            <div className="card h-100 border-0 shadow-sm hover-lift">
              <div className="card-body p-5">
                <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--bs-primary) 0%, color-mix(in srgb, var(--bs-primary), #000 10%) 100%)', boxShadow: '0 10px 30px rgba(var(--bs-primary-rgb), 0.3)' }}>
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
                <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--bs-primary) 0%, color-mix(in srgb, var(--bs-primary), #000 10%) 100%)', boxShadow: '0 10px 30px rgba(var(--bs-primary-rgb), 0.3)' }}>
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
                <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--bs-primary) 0%, color-mix(in srgb, var(--bs-primary), #000 10%) 100%)', boxShadow: '0 10px 30px rgba(var(--bs-primary-rgb), 0.3)' }}>
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
                <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--bs-primary) 0%, color-mix(in srgb, var(--bs-primary), #000 10%) 100%)', boxShadow: '0 10px 30px rgba(var(--bs-primary-rgb), 0.3)' }}>
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
                <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--bs-primary) 0%, color-mix(in srgb, var(--bs-primary), #000 10%) 100%)', boxShadow: '0 10px 30px rgba(var(--bs-primary-rgb), 0.3)' }}>
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
                <div className="d-flex align-items-center justify-content-center rounded-circle mb-4 mx-auto" style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, var(--bs-primary) 0%, color-mix(in srgb, var(--bs-primary), #000 10%) 100%)', boxShadow: '0 10px 30px rgba(var(--bs-primary-rgb), 0.3)' }}>
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
  )
}
