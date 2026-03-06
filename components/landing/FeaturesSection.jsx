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
    <section id="features" className="py-6">
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6">
        <div className="py-10 px-6 rounded-2xl sm:py-12 sm:px-8 sm:rounded-[20px] lg:py-20 lg:px-16 lg:rounded-3xl bg-surface-200">
          <div className="text-center mb-5">
            <h2 className="text-[1.75rem] sm:text-[2.25rem] lg:text-[2.75rem] font-extrabold text-surface-900 tracking-[-0.025em] leading-[1.15] mb-3">Why businesses choose us</h2>
            <p className="text-surface-500 text-[1.1rem] leading-[1.6] mb-0 text-surface-600">
              Everything you need to accept crypto at scale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {FEATURES.map((f) => (
              <div key={f.title}>
                <div className="bg-card rounded-[20px] p-7 sm:rounded-2xl sm:p-9 h-full transition-transform duration-200 hover:-translate-y-0.5">
                  <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-[1.3rem] mb-5" style={{ background: f.bg, color: f.color }}>
                    <i className={`bx ${f.icon}`}></i>
                  </div>
                  <h5 className="font-bold mb-2 text-surface-900 text-[1.05rem]">{f.title}</h5>
                  <p className="text-surface-500 text-[0.9rem] m-[0px] leading-[1.6]">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Fee comparison */}
          <div className="bg-card rounded-[20px] py-5 px-5 sm:py-6 sm:px-6 lg:py-8 lg:px-10">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="md:flex-1 mb-3 md:mb-0">
                <h5 className="font-bold mb-1 text-surface-900">Save up to 83% on processing fees</h5>
                <p className="text-surface-500 text-[0.92rem] m-[0px]">
                  Traditional processors charge 2.9% + $0.30. We charge just 0.5%.
                </p>
              </div>
              <div className="flex md:justify-end gap-5">
                <div className="text-center">
                  <div className="text-[2.25rem] font-extrabold text-primary-600">0.5%</div>
                  <div className="text-[0.78rem] text-surface-500 font-semibold">BULL PAY</div>
                </div>
                <div className="text-center">
                  <div className="text-[2.25rem] font-extrabold text-surface-300 line-through">2.9%</div>
                  <div className="text-[0.78rem] text-surface-300 font-semibold">Traditional</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
