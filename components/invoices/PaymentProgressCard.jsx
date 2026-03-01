'use client'

export default function PaymentProgressCard({ invoice, t }) {
  const status = String(invoice?.status || '').toLowerCase()
  const amountRequired = parseFloat(invoice?.amountRequired || invoice?.amount || 0)
  const amountReceived = parseFloat(invoice?.amountReceived || 0)
  const percentage = amountRequired > 0 ? Math.min((amountReceived / amountRequired) * 100, 100) : 0

  const steps = [
    { key: 'created', label: t?.('invoices.created', { defaultValue: 'Created' }) || 'Created', done: true },
    { key: 'awaiting', label: t?.('invoices.awaitingPayment', { defaultValue: 'Awaiting Payment' }) || 'Awaiting Payment', done: status !== 'pending' && status !== 'created' },
    { key: 'received', label: t?.('invoices.paymentReceived', { defaultValue: 'Payment Received' }) || 'Payment Received', done: status === 'paid' || status === 'completed' || status === 'partially_paid' },
    { key: 'completed', label: t?.('invoices.completed', { defaultValue: 'Completed' }) || 'Completed', done: status === 'paid' || status === 'completed' },
  ]

  return (
    <div className="card mb-3">
      <div className="card-body">
        <h6 className="mb-3">
          {t?.('invoices.paymentProgress', { defaultValue: 'Payment Progress' }) || 'Payment Progress'}
        </h6>

        {/* Progress bar */}
        <div className="progress mb-3" style={{ height: 8 }}>
          <div
            className={`progress-bar ${status === 'expired' || status === 'cancelled' ? 'bg-danger' : 'bg-success'}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>

        <div className="d-flex justify-content-between small text-muted mb-3">
          <span>{amountReceived} / {amountRequired} {invoice?.coinSymbol || ''}</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>

        {/* Steps */}
        <div className="d-flex justify-content-between">
          {steps.map((step) => (
            <div key={step.key} className="text-center">
              <div
                className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-1 ${
                  step.done ? 'bg-success text-white' : 'bg-label-secondary'
                }`}
                style={{ width: 28, height: 28 }}
              >
                {step.done ? <i className="bx bx-check small"></i> : <span className="small">&bull;</span>}
              </div>
              <div className="small text-muted">{step.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
