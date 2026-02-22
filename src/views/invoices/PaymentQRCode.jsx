import { useTranslation } from 'react-i18next'
import { QRCodeSVG as QRCode } from 'qrcode.react'

export default function PaymentQRCode({ isExpired, isPaid, paymentValue, qrcodeSize }) {
  const { t } = useTranslation()

  if (isExpired && !isPaid) {
    return (
      <div className="col-12 d-flex justify-content-center">
        <div className="text-center"></div>
      </div>
    )
  }

  return (
    <div className="col-12 d-flex justify-content-center">
      <div className="text-center">
        <QRCode value={paymentValue} size={qrcodeSize} includeMargin={true} />
        <div className="mt-2 small text-muted">
          {t("payment.scanToPay") || "Scan to pay"}
        </div>
      </div>
    </div>
  )
}
