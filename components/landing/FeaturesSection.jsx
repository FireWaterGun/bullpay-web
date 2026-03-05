'use client'

const FEATURES = [
  {
    icon: 'bx-bolt-circle',
    title: 'Instant settlement',
    desc: 'Funds swept and credited the moment confirmations complete.',
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.1)',
  },
  {
    icon: 'bx-shield-quarter',
    title: 'Zero chargebacks',
    desc: 'Crypto is irreversible. Eliminate fraud and disputes entirely.',
    color: '#1e40af',
    bg: 'rgba(30, 64, 175, 0.1)',
  },
  {
    icon: 'bx-code-alt',
    title: 'Developer-friendly API',
    desc: 'RESTful API with webhooks and sandbox. Integrate in minutes.',
    color: '#3b82f6',
    bg: 'rgba(59, 130, 246, 0.1)',
  },
  {
    icon: 'bx-line-chart',
    title: 'Real-time dashboard',
    desc: 'Monitor payments, balances, and analytics with live status.',
    color: '#0ea5e9',
    bg: 'rgba(14, 165, 233, 0.1)',
  },
]

export default function FeaturesSection() {
  return (
    <section id="features" className="landing-section">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="landing-tile landing-tile-slate">
          <div className="text-center mb-5">
            <h2 className="landing-section-title mb-3">Why businesses choose us</h2>
            <p className="landing-section-subtitle mb-0" style={{ color: '#475569' }}>
              Everything you need to accept crypto at scale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <div className="landing-feature-card">
                  <div className="landing-feature-icon" style={{ background: f.bg, color: f.color }}>
                    <i className={`bx ${f.icon}`}></i>
                  </div>
                  <h5 className="font-bold mb-2" style={{ color: '#1a1a2e', fontSize: '1.05rem' }}>{f.title}</h5>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem', margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Fee comparison */}
          <div className="landing-fee-strip">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="md:flex-1 mb-3 md:mb-0">
                <h5 className="font-bold mb-1" style={{ color: '#1a1a2e' }}>Save up to 83% on processing fees</h5>
                <p style={{ color: '#6b7280', fontSize: '0.92rem', margin: 0 }}>
                  Traditional processors charge 2.9% + $0.30. We charge just 0.5%.
                </p>
              </div>
              <div className="flex md:justify-end gap-5">
                <div className="text-center">
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#2563eb' }}>0.5%</div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280', fontWeight: 600 }}>BULL PAY</div>
                </div>
                <div className="text-center">
                  <div style={{ fontSize: '2.25rem', fontWeight: 800, color: '#d1d5db', textDecoration: 'line-through' }}>2.9%</div>
                  <div style={{ fontSize: '0.78rem', color: '#d1d5db', fontWeight: 600 }}>Traditional</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
