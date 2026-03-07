'use client';
import Card from '@/components/ui/Card'

export default function PaymentProgressCard({ invoice, t }) {
  const status = String(invoice?.status || '').toLowerCase();
  const amountRequired = parseFloat(invoice?.amountRequired || invoice?.amount || 0);
  const amountReceived = parseFloat(invoice?.amountReceived || 0);
  const percentage = amountRequired > 0 ? Math.min(amountReceived / amountRequired * 100, 100) : 0;

  const steps = [
  { key: 'created', label: t?.('invoices.created', { defaultValue: 'Created' }) || 'Created', done: true },
  { key: 'awaiting', label: t?.('invoices.awaitingPayment', { defaultValue: 'Awaiting Payment' }) || 'Awaiting Payment', done: status !== 'pending' && status !== 'created' },
  { key: 'received', label: t?.('invoices.paymentReceived', { defaultValue: 'Payment Received' }) || 'Payment Received', done: status === 'paid' || status === 'completed' || status === 'partially_paid' },
  { key: 'completed', label: t?.('invoices.completed', { defaultValue: 'Completed' }) || 'Completed', done: status === 'paid' || status === 'completed' }];


  return (
    <Card className="mb-3">
      <div className="p-5">
        <h6 className="mb-3">
          {t?.('invoices.paymentProgress', { defaultValue: 'Payment Progress' }) || 'Payment Progress'}
        </h6>

        {/* Progress bar */}
        <div className="h-2 w-full rounded-full bg-surface-200 overflow-hidden mb-3">
          <div
            className={`h-full rounded-full ${status === 'expired' || status === 'cancelled' ? 'bg-danger-500' : 'bg-success-500'}`}
            style={{ width: `${percentage}%` }}>
          </div>
        </div>

        <div className="flex justify-between text-sm text-surface-500 mb-3">
          <span>{amountReceived} / {amountRequired} {invoice?.coinSymbol || ''}</span>
          <span>{percentage.toFixed(1)}%</span>
        </div>

        {/* Steps */}
        <div className="flex justify-between">
          {steps.map((step) =>
          <div key={step.key} className="text-center">
              <div
              className={`rounded-full inline-flex items-center justify-center mb-1 ${step.done ? 'bg-success text-white' : 'bg-surface-100 text-surface-600'} w-7 h-7`
              }>

              
                {step.done ? <i className="bx bx-check text-sm"></i> : <span className="text-sm">&bull;</span>}
              </div>
              <div className="text-sm text-surface-500">{step.label}</div>
            </div>
          )}
        </div>
      </div>
    </Card>);

}