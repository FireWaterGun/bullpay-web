'use client'

import Image from 'next/image'

export default function PaymentQRCode({ qrDataUrl, size = 200, alt = 'Payment QR Code' }) {
  if (!qrDataUrl) {
    return (
      <div
        className="flex items-center justify-center bg-surface-50 rounded"
        style={{ width: size, height: size }}
      >
        <span className="text-surface-500 text-sm">No QR</span>
      </div>
    )
  }

  return (
    <Image
      src={qrDataUrl}
      alt={alt}
      width={size}
      height={size}
      unoptimized
      className="rounded [image-rendering:pixelated]"
     
    />
  )
}
