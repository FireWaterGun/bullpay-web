'use client';

import { useTranslation } from 'react-i18next';
import { QRCodeSVG as QRCode } from 'qrcode.react';
import CoinImg from '@/components/CoinImg';
import { formatAmount } from '@/lib/utils/format';
import Button from '../ui/Button'

export default function PaymentQRSection({
  invoice, coinSym, networkName, paymentValue,
  isPaid, copiedAmt, handleCopyAmount
}) {
  const { t } = useTranslation();

  const amtStr = formatAmount(invoice.amount);
  const len = amtStr.length;
  const fontSize = len > 14 ? '1rem' : len > 11 ? '1.2rem' : len > 8 ? '1.4rem' : '1.7rem';

  return (
    <div className="mb-4">
      {/* QR + Amount Card */}
      <div className="rounded-lg p-3" style={{ border: '1px solid var(--color-surface-200)' }}>
        <div className="flex gap-3 items-center">
          {/* QR Code - Left */}
          {!isPaid &&
          <div className="text-center shrink-0">
              <div className="inline-block relative p-2 rounded-lg bg-surface-0">
                <QRCode
                value={paymentValue}
                size={130}
                includeMargin={false}
                level="H" />
              
              </div>
              <div className="mt-2 text-xs text-surface-500 font-medium">
                {t("payment.scanToPay") || "Scan to Pay"}
              </div>
            </div>
          }

          {/* Coin Info + Amount - Right */}
          <div className="grow flex flex-col items-center justify-center min-w-0">
            {/* Coin */}
            <div className="flex items-center gap-2 mb-2">
              <CoinImg symbol={coinSym} logoUrl={invoice?.coin?.logoUrl} size={32} imgClassName="rounded-full" />
              <div>
                <div className="text-[1rem] font-bold text-surface-900 leading-[1.2]">
                  {coinSym}
                </div>
                <div className="text-[0.7rem] text-surface-500 font-medium">
                  on {networkName || 'Network'}
                </div>
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center gap-2 mb-1">
              <span className="font-extrabold tracking-[-0.5px] text-primary-600 leading-[1]" style={{ fontSize }}>
                {amtStr}
              </span>
              {invoice.amount != null && !isPaid &&
              <Button
                type="button"

                style={{ width: 30, height: 30, border: '1px solid var(--color-surface-200)', background: copiedAmt ? 'var(--color-success-500)' : 'var(--color-surface-0, #fff)', color: copiedAmt ? '#fff' : 'var(--color-surface-500)', padding: 0, transition: 'all 0.2s ease' }}
                onClick={handleCopyAmount}
                title={copiedAmt ? t("actions.copied") : t("actions.copyAmount", { defaultValue: "Copy Amount" })} size="icon" className="shrink-0 rounded-lg flex items-center justify-center">
                
                  <i className={`bx ${copiedAmt ? 'bx-check' : 'bx-copy'} text-[14px]`}></i>
                </Button>
              }
            </div>

            {/* Fiat Equivalent */}
            {(invoice.fiatAmount || invoice.fiatCurrency) &&
            <div className="text-[0.78rem] text-surface-500 font-medium">
                ≈ ${invoice.fiatAmount || '0.00'} {invoice.fiatCurrency || 'USD'}
              </div>
            }
          </div>
        </div>
      </div>
    </div>);

}