'use client'

export default function PaymentQRCode({ qrDataUrl, size = 200, alt = 'Payment QR Code' }) {
  if (!qrDataUrl) {
    return (
      <div
        className="d-flex align-items-center justify-content-center bg-light rounded"
        style={{ width: size, height: size }}
      >
        <span className="text-muted small">No QR</span>
      </div>
    )
  }

  return (
    <img
      src={qrDataUrl}
      alt={alt}
      width={size}
      height={size}
      className="rounded"
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
