'use client'

export default function FooterSection() {
  const year = new Date().getFullYear()

  return (
    <footer className="landing-footer py-5 mt-3">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 py-4">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="flex items-center mb-3">
              <i className="bx bxs-wallet-alt text-3xl mr-2" style={{ color: '#2563eb' }}></i>
              <span className="font-bold text-xl">
                <span style={{ color: '#0f172a' }}>BULL</span>
                <span style={{ color: '#2563eb' }}>PAY</span>
              </span>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.9rem', maxWidth: 300, lineHeight: 1.65 }}>
              Professional cryptocurrency payment gateway for businesses worldwide.
            </p>
            <div className="flex gap-2 mt-3">
              {['bxl-twitter', 'bxl-github', 'bxl-telegram', 'bxl-discord-alt'].map((icon) => (
                <a key={icon} href="#" className="landing-footer-social">
                  <i className={`bx ${icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div className="lg:col-span-2">
            <h6 className="font-bold mb-3" style={{ color: '#1a1a2e', fontSize: '0.85rem' }}>Product</h6>
            <ul className="list-none p-0" style={{ fontSize: '0.9rem' }}>
              <li className="mb-2"><a href="#features">Features</a></li>
              <li className="mb-2"><a href="#currencies">Currencies</a></li>
              <li className="mb-2"><a href="#">Pricing</a></li>
            </ul>
          </div>

          {/* Developers */}
          <div className="lg:col-span-2">
            <h6 className="font-bold mb-3" style={{ color: '#1a1a2e', fontSize: '0.85rem' }}>Developers</h6>
            <ul className="list-none p-0" style={{ fontSize: '0.9rem' }}>
              <li className="mb-2"><a href="#">API Docs</a></li>
              <li className="mb-2"><a href="#">SDKs</a></li>
              <li className="mb-2"><a href="#">Status</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h6 className="font-bold mb-3" style={{ color: '#1a1a2e', fontSize: '0.85rem' }}>Company</h6>
            <ul className="list-none p-0" style={{ fontSize: '0.9rem' }}>
              <li className="mb-2"><a href="#">About</a></li>
              <li className="mb-2"><a href="#">Blog</a></li>
              <li className="mb-2"><a href="#">Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="lg:col-span-2">
            <h6 className="font-bold mb-3" style={{ color: '#1a1a2e', fontSize: '0.85rem' }}>Legal</h6>
            <ul className="list-none p-0" style={{ fontSize: '0.9rem' }}>
              <li className="mb-2"><a href="#">Terms</a></li>
              <li className="mb-2"><a href="#">Privacy</a></li>
              <li className="mb-2"><a href="#">Cookies</a></li>
            </ul>
          </div>
        </div>

        <hr style={{ borderColor: '#e5e7eb', opacity: 0.5 }} />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <span style={{ color: '#9ca3af', fontSize: '0.82rem' }}>
            &copy; {year} BULL PAY. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}
