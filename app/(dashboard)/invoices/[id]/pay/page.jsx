'use client'

import { useParams } from 'next/navigation'
import InvoicePaymentV2 from '@/app/(public)/pay/[id]/page'

export default function InvoicePayPage() {
  return <InvoicePaymentV2 />
}
