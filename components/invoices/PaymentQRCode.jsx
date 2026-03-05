'use client'

export default function PaymentQRCode({ qrDataUrl, size = 200, alt = 'Payment QR Code' }) {
  if (!qrDataUrl) {
    return (
      <div
        className="flex items-center justify-center bg-surface-50 rounded"
        style={{ width: size, height: size }}
      >
        <span className="text-muted text-sm">No QR</span>
      </div>
    )
  }

  return (
    <img
      src={qrDataUrl}
      alt={alt}
      width={size}
      height={size}
      className="rounded [image-rendering:pixelated]"
     
    />
  )
}
