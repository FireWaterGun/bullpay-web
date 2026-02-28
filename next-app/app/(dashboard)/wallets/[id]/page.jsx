'use client'

import WalletEdit from '@/components/balance/WalletEdit'

/** Wallet detail -- just shows the edit form for now */
export default function WalletDetailPage() {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <WalletEdit />
    </div>
  )
}
