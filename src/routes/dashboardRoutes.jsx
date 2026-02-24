import { lazy } from 'react'
import { Route, Navigate } from 'react-router-dom'

// Page components (lazy — loaded on navigation)
const UserTransactionsDashboard = lazy(() => import('../views/app/UserTransactionsDashboard'))
const Settings = lazy(() => import('../views/app/Settings'))
const WalletCreate = lazy(() => import('../views/wallets/WalletCreate'))
const WalletEdit = lazy(() => import('../views/wallets/WalletEdit'))
const WalletVerify = lazy(() => import('../views/wallets/WalletVerify'))
const InvoiceList = lazy(() => import('../views/invoices/InvoiceList'))
const InvoiceCreate = lazy(() => import('../views/invoices/InvoiceCreate'))
const InvoiceDetail = lazy(() => import('../views/invoices/InvoiceDetail'))
const InvoicePayment = lazy(() => import('../views/invoices/InvoicePayment'))
const BalanceAccount = lazy(() => import('../views/balance/BalanceAccount'))
const BalanceWithdrawals = lazy(() => import('../views/balance/BalanceWithdrawals'))
const WithdrawRequest = lazy(() => import('../views/balance/WithdrawRequest'))
const WithdrawalDetail = lazy(() => import('../views/balance/WithdrawalDetail'))
const RevenueDashboard = lazy(() => import('../views/admin/RevenueDashboard'))
const SystemBalance = lazy(() => import('../views/admin/SystemBalance'))
const WalletTransaction = lazy(() => import('../views/admin/WalletTransaction'))
const CoinList = lazy(() => import('../views/crypto/CoinList'))
const CoinForm = lazy(() => import('../views/crypto/CoinForm'))
const NetworkList = lazy(() => import('../views/crypto/NetworkList'))
const NetworkForm = lazy(() => import('../views/crypto/NetworkForm'))
const SupportedCrypto = lazy(() => import('../views/crypto/SupportedCrypto'))
const SupportedCryptoForm = lazy(() => import('../views/crypto/SupportedCryptoForm'))
const Sweep = lazy(() => import('../views/admin/Sweep'))
const SweepOverrides = lazy(() => import('../views/admin/SweepOverrides'))
const SweepTransactions = lazy(() => import('../views/admin/SweepTransactions'))
const GasTopups = lazy(() => import('../views/admin/GasTopups'))
const GasTopupDetail = lazy(() => import('../views/admin/GasTopupDetail'))
const SweepDetail = lazy(() => import('../views/admin/SweepDetail'))
const WithdrawalDefaults = lazy(() => import('../views/admin/WithdrawalDefaults'))
const WithdrawalOverrides = lazy(() => import('../views/admin/WithdrawalOverrides'))
const WithdrawalPolicy = lazy(() => import('../views/admin/WithdrawalPolicy'))
const WithdrawalTransactions = lazy(() => import('../views/withdrawals/WithdrawalTransactions'))
const WithdrawalAddresses = lazy(() => import('../views/withdrawals/WithdrawalAddresses'))
const WithdrawalAddressDetail = lazy(() => import('../views/withdrawals/WithdrawalAddressDetail'))
const UserList = lazy(() => import('../views/admin/UserList'))
const MerchantList = lazy(() => import('../views/admin/MerchantList'))
const MerchantSettings = lazy(() => import('../views/merchant/MerchantSettings'))
const AdminSettings = lazy(() => import('../views/admin/AdminSettings'))
const SystemLedgerList = lazy(() => import('../views/ledger/SystemLedgerList'))
const SystemLedgerDetail = lazy(() => import('../views/ledger/SystemLedgerDetail'))
const UserLedgerList = lazy(() => import('../views/ledger/UserLedgerList'))
const UserLedgerDetail = lazy(() => import('../views/ledger/UserLedgerDetail'))
const AdminInvoiceList = lazy(() => import('../views/admin/AdminInvoiceList'))
const AdminInvoiceDetail = lazy(() => import('../views/admin/AdminInvoiceDetail'))
const AdminPaymentList = lazy(() => import('../views/admin/AdminPaymentList'))
const AdminPaymentDetail = lazy(() => import('../views/admin/AdminPaymentDetail'))
const PlatformLedgerList = lazy(() => import('../views/ledger/PlatformLedgerList'))
const PlatformLedgerDetail = lazy(() => import('../views/ledger/PlatformLedgerDetail'))
const IncomeStatement = lazy(() => import('../views/ledger/IncomeStatement'))
const MyLedgerList = lazy(() => import('../views/ledger/MyLedgerList'))
const MyLedgerDetail = lazy(() => import('../views/ledger/MyLedgerDetail'))
const EVMFeePolicy = lazy(() => import('../views/admin/EVMFeePolicy'))
const NetworkFees = lazy(() => import('../views/admin/NetworkFees'))
const AdminRoles = lazy(() => import('../views/admin/AdminRoles'))
const RolePermissions = lazy(() => import('../views/admin/RolePermissions'))
const TempWalletList = lazy(() => import('../views/admin/TempWalletList'))
const TempWalletDetail = lazy(() => import('../views/admin/TempWalletDetail'))
const TempWalletHistoryList = lazy(() => import('../views/admin/TempWalletHistoryList'))
const TempWalletHistoryDetail = lazy(() => import('../views/admin/TempWalletHistoryDetail'))

export function renderAdminRoutes() {
  return (
    <>
      {/* Admin routes — paths match API /me/navigation */}
      <Route path="admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="admin/dashboard" element={<RevenueDashboard />} />
      <Route path="admin/income-statement" element={<IncomeStatement />} />
      <Route path="admin/revenue-expenses" element={<PlatformLedgerList />} />
      <Route path="admin/revenue-expenses/:id" element={<PlatformLedgerDetail />} />
      <Route path="admin/platform-ledger" element={<PlatformLedgerList />} />
      <Route path="admin/platform-ledger/:id" element={<PlatformLedgerDetail />} />
      <Route path="admin/system-wallets" element={<SystemBalance />} />
      <Route path="admin/system-wallets/wallet/:walletId/transactions" element={<WalletTransaction />} />
      <Route path="admin/withdrawals" element={<WithdrawalTransactions />} />
      <Route path="admin/withdrawals/addresses" element={<WithdrawalAddresses />} />
      <Route path="admin/withdrawal-addresses" element={<WithdrawalAddresses />} />
      <Route path="admin/withdrawal-addresses/:id" element={<WithdrawalAddressDetail />} />
      <Route path="admin/sweeps" element={<SweepTransactions />} />
      <Route path="admin/sweeps/:id" element={<SweepDetail />} />
      <Route path="admin/wallet-gas-topups" element={<GasTopups />} />
      <Route path="admin/wallet-gas-topups/:id" element={<GasTopupDetail />} />
      <Route path="admin/users" element={<UserList />} />
      <Route path="admin/merchants" element={<MerchantList />} />
      <Route path="admin/settings" element={<AdminSettings />} />
      <Route path="admin/coins" element={<CoinList />} />
      <Route path="admin/coins/create" element={<CoinForm />} />
      <Route path="admin/coins/edit/:id" element={<CoinForm />} />
      <Route path="admin/coins/:id" element={<CoinForm />} />
      <Route path="admin/networks" element={<NetworkList />} />
      <Route path="admin/networks/create" element={<NetworkForm />} />
      <Route path="admin/networks/:id" element={<NetworkForm />} />
      <Route path="admin/coin-networks" element={<SupportedCrypto />} />
      <Route path="admin/coin-networks/create" element={<SupportedCryptoForm />} />
      <Route path="admin/coin-networks/:id" element={<SupportedCryptoForm />} />
      <Route path="admin/system-ledger" element={<SystemLedgerList />} />
      <Route path="admin/system-ledger/:id" element={<SystemLedgerDetail />} />
      <Route path="admin/user-ledger" element={<UserLedgerList />} />
      <Route path="admin/user-ledger/:id" element={<UserLedgerDetail />} />
      <Route path="admin/invoices" element={<AdminInvoiceList />} />
      <Route path="admin/invoices/:id" element={<AdminInvoiceDetail />} />
      <Route path="admin/payments" element={<AdminPaymentList />} />
      <Route path="admin/payments/:id" element={<AdminPaymentDetail />} />
      <Route path="admin/settings/evm/fee-policy" element={<EVMFeePolicy />} />
      <Route path="admin/settings/network/fees" element={<NetworkFees />} />
      <Route path="admin/settings/sweep/configuration" element={<Sweep />} />
      <Route path="admin/settings/sweep/overrides" element={<SweepOverrides />} />
      <Route path="admin/settings/withdrawal/defaults" element={<WithdrawalDefaults />} />
      <Route path="admin/settings/withdrawal/overrides" element={<WithdrawalOverrides />} />
      <Route path="admin/settings/withdrawal/policy" element={<WithdrawalPolicy />} />
      <Route path="admin/roles" element={<AdminRoles />} />
      <Route path="admin/roles/:role" element={<RolePermissions />} />
      <Route path="admin/temp-wallets" element={<TempWalletList />} />
      <Route path="admin/temp-wallets/:id" element={<TempWalletDetail />} />
      <Route path="admin/temp-wallet-histories" element={<TempWalletHistoryList />} />
      <Route path="admin/temp-wallet-histories/:id" element={<TempWalletHistoryDetail />} />
      {/* Redirects from old paths */}
      <Route path="admin/revenue" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="admin/revenue/income-statement" element={<Navigate to="/admin/income-statement" replace />} />
      <Route path="admin/revenue/revenue-expenses" element={<Navigate to="/admin/revenue-expenses" replace />} />
      <Route path="admin/system-wallet/balance" element={<Navigate to="/admin/system-wallets" replace />} />
      <Route path="admin/withdrawals/transactions" element={<Navigate to="/admin/withdrawals" replace />} />
      <Route path="admin/sweeps/transactions" element={<Navigate to="/admin/sweeps" replace />} />
      <Route path="admin/system-ledger/system" element={<Navigate to="/admin/system-ledger" replace />} />
      <Route path="admin/system-ledger/user" element={<Navigate to="/admin/user-ledger" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </>
  )
}

export function renderUserRoutes() {
  return (
    <>
      {/* User routes — paths match API NAVIGATION_TREE */}
      <Route path="dashboard" element={<UserTransactionsDashboard />} />
      <Route path="wallet" element={<BalanceAccount />} />
      <Route path="wallet/withdrawals" element={<BalanceWithdrawals />} />
      <Route path="wallet/withdrawals/:id" element={<WithdrawalDetail />} />
      <Route path="wallet/withdraw/:coinNetworkId" element={<WithdrawRequest />} />
      <Route path="wallet/new-address" element={<WalletCreate />} />
      <Route path="wallet/verify-address" element={<WalletVerify />} />
      <Route path="invoices" element={<InvoiceList />} />
      <Route path="invoices/create" element={<InvoiceCreate />} />
      <Route path="invoices/:id" element={<InvoiceDetail />} />
      <Route path="invoices/:id/pay" element={<InvoicePayment />} />
      <Route path="settings" element={<Settings />} />
      <Route path="merchant" element={<MerchantSettings />} />
      <Route path="ledger" element={<MyLedgerList />} />
      <Route path="ledger/:id" element={<MyLedgerDetail />} />
      <Route path="wallets" element={<Navigate to="/wallet/withdrawals" replace />} />
      <Route path="wallets/create" element={<WalletCreate />} />
      <Route path="wallets/:id/edit" element={<WalletEdit />} />
      <Route path="wallets/verify" element={<WalletVerify />} />
      {/* Legacy paths that still need to work */}
      <Route path="app/balance/verify-address" element={<WalletVerify />} />
      {/* Redirects from old paths */}
      <Route path="app" element={<Navigate to="/dashboard" replace />} />
      <Route path="app/*" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </>
  )
}
