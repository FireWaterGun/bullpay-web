export default function FooterSection() {
  return (
    <footer className="py-5 bg-white border-top">
      <div className="container-xxl">
        <div className="row g-4 py-4">
          <div className="col-lg-4">
            <div className="d-flex align-items-center mb-3">
              <i className="bx bxs-wallet-alt fs-2 text-primary me-2"></i>
              <span className="fw-bold fs-4">
                <span className="text-dark">BULL</span>
                <span className="text-primary">PAY</span>
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
  )
}
