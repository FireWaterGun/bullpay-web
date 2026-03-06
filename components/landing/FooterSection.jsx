'use client'

const footerLink = 'text-slate-500 no-underline transition-colors duration-200 hover:text-surface-900'

export default function FooterSection() {
  const year = new Date().getFullYear()

  return (
    <footer className="py-5 mt-3 bg-transparent">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 py-4">
          {/* Brand */}
          <div className="lg:col-span-4">
            <div className="flex items-center mb-3">
              <i className="bx bxs-wallet-alt text-3xl mr-2 text-primary-600"></i>
              <span className="font-bold text-xl">
                <span className="text-surface-900">BULL</span>
                <span className="text-primary-600">PAY</span>
              </span>
            </div>
            <p className="text-surface-500 text-[0.9rem] max-w-[300px] leading-[1.65]">
              Professional cryptocurrency payment gateway for businesses worldwide.
            </p>
            <div className="flex gap-2 mt-3">
              {['bxl-twitter', 'bxl-github', 'bxl-telegram', 'bxl-discord-alt'].map((icon) => (
                <a key={icon} href="#" className="w-9 h-9 rounded-full inline-flex items-center justify-center text-slate-500 transition-[color,background] duration-200 no-underline text-[1.15rem] hover:text-primary-600 hover:bg-[rgba(37,99,235,0.08)]">
                  <i className={`bx ${icon}`}></i>
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div className="lg:col-span-2">
            <h6 className="font-bold mb-3 text-surface-900 text-[0.85rem]">Product</h6>
            <ul className="list-none p-0 text-[0.9rem]">
              <li className="mb-2"><a href="#features" className={footerLink}>Features</a></li>
              <li className="mb-2"><a href="#currencies" className={footerLink}>Currencies</a></li>
              <li className="mb-2"><a href="#" className={footerLink}>Pricing</a></li>
            </ul>
          </div>

          {/* Developers */}
          <div className="lg:col-span-2">
            <h6 className="font-bold mb-3 text-surface-900 text-[0.85rem]">Developers</h6>
            <ul className="list-none p-0 text-[0.9rem]">
              <li className="mb-2"><a href="#" className={footerLink}>API Docs</a></li>
              <li className="mb-2"><a href="#" className={footerLink}>SDKs</a></li>
              <li className="mb-2"><a href="#" className={footerLink}>Status</a></li>
            </ul>
          </div>

          {/* Company */}
          <div className="lg:col-span-2">
            <h6 className="font-bold mb-3 text-surface-900 text-[0.85rem]">Company</h6>
            <ul className="list-none p-0 text-[0.9rem]">
              <li className="mb-2"><a href="#" className={footerLink}>About</a></li>
              <li className="mb-2"><a href="#" className={footerLink}>Blog</a></li>
              <li className="mb-2"><a href="#" className={footerLink}>Contact</a></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="lg:col-span-2">
            <h6 className="font-bold mb-3 text-surface-900 text-[0.85rem]">Legal</h6>
            <ul className="list-none p-0 text-[0.9rem]">
              <li className="mb-2"><a href="#" className={footerLink}>Terms</a></li>
              <li className="mb-2"><a href="#" className={footerLink}>Privacy</a></li>
              <li className="mb-2"><a href="#" className={footerLink}>Cookies</a></li>
            </ul>
          </div>
        </div>

        <hr className="border-surface-200 opacity-50" />

        <div className="flex flex-col md:flex-row justify-between items-center">
          <span className="text-surface-400 text-[0.82rem]">
            &copy; {year} BULL PAY. All rights reserved.
          </span>
        </div>
      </div>
    </footer>
  )
}
