'use client'

const STEPS = [
  {
    num: '01',
    title: 'Create invoice',
    desc: 'Generate a payment request via dashboard or API. A unique wallet address is assigned automatically.',
  },
  {
    num: '02',
    title: 'Customer pays',
    desc: 'Your customer sends crypto to the invoice address. We monitor the blockchain in real time.',
  },
  {
    num: '03',
    title: 'Funds settled',
    desc: 'Once confirmed, funds are swept to your wallet and your balance is credited instantly.',
  },
]

export default function HowItWorksSection() {
  return (
    <section className="landing-section">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="landing-tile landing-tile-blue">
          <div className="text-center mb-5">
            <h2 className="landing-section-title mb-3">Three steps to get paid</h2>
            <p className="landing-section-subtitle mb-0" style={{ color: '#1e40af' }}>
              Simple integration, instant results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
            {STEPS.map((step) => (
              <div key={step.num}>
                <div className="landing-step-badge mb-3">{step.num}</div>
                <h4 className="font-bold mb-2" style={{ color: '#1a1a2e', fontSize: '1.25rem' }}>{step.title}</h4>
                <p style={{ color: '#6b7280', fontSize: '0.95rem', margin: 0, lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
