'use client'

import { useParams, redirect } from 'next/navigation'

/**
 * Invoice Payment Page — redirects to unified /pay/:code
 *
 * The /pay/:code endpoint now handles both merchant payment publicIds
 * and invoice publicCodes via its unified resolver.
 * This redirect ensures all payment pages use a single URL pattern.
 */
export default function InvoicePaymentPage() {
  const { id } = useParams()
  redirect(`/pay/${id}`)
}
