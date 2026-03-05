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
    <section className="py-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6">
        <div className="py-10 px-6 rounded-2xl sm:py-12 sm:px-8 sm:rounded-[20px] lg:py-20 lg:px-16 lg:rounded-3xl bg-blue-100">
          <div className="text-center mb-5">
            <h2 className="text-[1.75rem] sm:text-[2.25rem] lg:text-[2.75rem] font-extrabold text-surface-900 tracking-[-0.025em] leading-[1.15] mb-3">Three steps to get paid</h2>
            <p className="text-slate-500 text-[1.1rem] leading-[1.6] mb-0 text-primary-800">
              Simple integration, instant results
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
            {STEPS.map((step) => (
              <div key={step.num}>
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-[14px] bg-[rgba(37,99,235,0.15)] text-base font-extrabold text-blue-800 mb-3">{step.num}</div>
                <h4 className="font-bold mb-2 text-surface-900 text-xl">{step.title}</h4>
                <p className="text-surface-500 text-[0.95rem] m-[0px] leading-[1.65]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
