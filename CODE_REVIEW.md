# Code Review Report — Bull Pay Web (`src/`)

**Reviewed**: 2026-02-22
**Files scanned**: 127 source files across 10 directories
**Skills applied**: vercel-react-best-practices, vercel-composition-patterns, web-design-guidelines, sneat-ui

---

## Architecture Overview

```
src/                          127 files total
├── api/                       15 files   Domain-organized API layer
│   ├── client.ts                         Generic apiFetch wrapper (Bearer auth, error handling)
│   ├── admin.ts                          Admin operations (~1,900 lines, largest API file)
│   ├── auth.ts                           Login, register, forgot password
│   ├── balance.ts                        User balance & crypto holdings
│   ├── coins.ts                          Coin management
│   ├── invoices.ts                       Invoice CRUD & payments
│   ├── merchant.ts                       Merchant operations (UNUSED - see issue #5)
│   ├── navigation.ts                     User navigation/permissions
│   ├── networks.ts                       Network management
│   ├── notifications.ts                  Notification management
│   ├── twoFactor.ts                      2FA operations
│   ├── userLedger.ts                     User ledger/transactions
│   ├── userTransactions.ts               User transaction history
│   ├── wallets.ts                        Wallet CRUD & verification
│   └── withdrawals.ts                    Withdrawal operations
│
├── components/                 8 files   Shared UI components
│   ├── CoinImg.jsx                       Coin/network image (default + NetworkIcon exports)
│   ├── ConfirmModal.jsx                  Generic confirmation dialog
│   ├── ErrorBoundary.jsx                 App-wide error boundary
│   ├── LocaleDatePicker.jsx              Locale-aware date picker
│   ├── LocaleDateRangePicker.jsx         Locale-aware date range picker
│   ├── Toast.jsx                         Toast notification display
│   ├── Verify2FAModal.jsx                2FA verification modal
│   └── modals/DeleteConfirmModal.jsx     Delete confirmation dialog
│
├── context/                    3 files   Global state providers
│   ├── AuthContext.jsx                   Auth/RBAC/navigation (useAuth hook)
│   ├── PusherContext.jsx                 Real-time WebSocket (usePusher hook)
│   └── ToastContext.jsx                  Toast notifications (useToastContext hook)
│
├── hooks/                      3 files   Custom hooks
│   ├── use2FAStatus.js                   2FA status polling
│   ├── useInvoiceEvents.js               Pusher invoice/withdrawal event listeners
│   └── useToast.js                       Toast state management
│
├── utils/                     10 files   Shared utilities
│   ├── amount_normalizer.ts              Multi-chain decimal conversion
│   ├── amount_normalizer.test.tsx         Unit tests
│   ├── authToken.ts                      JWT token extraction
│   ├── clipboard.ts                      copyToClipboard() with fallback
│   ├── coinAssets.ts                     Coin symbol → image mapping
│   ├── format.ts                         formatUsd, formatCrypto, dates
│   ├── notification.js                   Browser/audio notifications
│   ├── requestId.js                      DUPLICATE — see issue #1
│   ├── requestId.ts                      Request ID generation
│   └── roles.js                          ROLE_ICON, ROLE_COLOR, formatRoleLabel
│
├── views/                     79 files   Page components by feature
│   ├── admin/                 28 files   Admin dashboard pages
│   ├── app/                    6 files   Layout, sidebar, notifications, settings
│   ├── auth/                   6 files   Login, register, forgot, verify
│   ├── balance/                6 files   Balance, withdrawals, mock data
│   ├── crypto/                 5 files   Coin/network CRUD forms
│   ├── custody/                1 file    Custody management
│   ├── docs/                   1 file    API documentation
│   ├── invoices/               6 files   Invoice list, detail, create, payment
│   ├── landing/                1 file    Public landing page
│   ├── ledger/                10 files   Ledger transactions & statements
│   ├── merchant/               1 file    Merchant settings
│   ├── wallets/                4 files   Wallet CRUD & verification
│   └── withdrawals/            3 files   Withdrawal addresses & transactions
│
├── routes/AppRouter.jsx        1 file    Top-level routing + ProtectedRoute
├── i18n/index.ts               1 file    i18next setup (en, th, zh)
├── locales/                    3 dirs    en/common.json, th/common.json, zh/common.json
├── types/                      2 files   api.d.ts, env.d.ts
├── backup/                     3 files   Old landing page variants (DEAD CODE)
├── App.jsx                               DEAD CODE — exports null
└── main.jsx                              Entry point (5 lines)
```

### Key Architecture Decisions

- **State**: Context-based (AuthContext, PusherContext, ToastContext) — no Redux
- **Routing**: React Router 7 with ProtectedRoute wrapper; 55 lazy-loaded routes inside DashboardLayout
- **API**: Generic `apiFetch<T>()` client with Bearer auth, 401 auto-redirect, ApiError class
- **UI**: Sneat Bootstrap 5 loaded globally from index.html; Boxicons for icons
- **i18n**: react-i18next with en/th/zh; detection: querystring → localStorage → navigator
- **Real-time**: Pusher.js with channel subscriptions (invoice.{id}, user.{userId}.events)
- **Bundle**: ~580 kB main chunk (reduced from 1,493 kB via lazy loading)

---

## Issues Found

### CRITICAL

#### #1 — Duplicate requestId files
- **Files**: `src/utils/requestId.js` + `src/utils/requestId.ts`
- **Problem**: Both export the same `requestId()` function. Module resolution picks one unpredictably. 10 API files import this.
- **Fix**: Delete `requestId.js`, keep `requestId.ts` (has proper TypeScript types)

#### #2 — Dead code: DashboardHome.jsx (1,482 lines)
- **File**: `src/views/app/DashboardHome.jsx`
- **Problem**: Not imported anywhere in the codebase. References `window.ApexCharts` and vendor scripts.
- **Fix**: Delete the file

#### #3 — Dead code: App.jsx
- **File**: `src/App.jsx`
- **Problem**: Contains `export default function App(){ return null }` with comment "no longer used"
- **Fix**: Delete the file

---

### HIGH

#### #4 — Direct navigator.clipboard calls instead of shared utility
- **Files** (6):
  - `src/views/app/Settings.jsx` — lines 101, 110
  - `src/views/invoices/InvoicePaymentV2.jsx` — multiple locations
  - `src/views/invoices/InvoiceList.jsx`
  - `src/views/invoices/InvoicePayment.jsx`
  - `src/views/invoices/InvoiceDetail.jsx`
  - `src/views/admin/SystemBalance.jsx`
- **Problem**: Uses `navigator.clipboard.writeText()` directly instead of `copyToClipboard()` from `src/utils/clipboard.ts` which has a legacy fallback for older browsers
- **Fix**: Replace all with `import { copyToClipboard } from '../../utils/clipboard'`

#### #5 — merchant.ts entirely unused
- **File**: `src/api/merchant.ts` — 5 functions, 70 lines
- **Functions**: `registerMerchant()`, `getMerchantProfile()`, `rotateSecret()`, `regenerateKey()`, `updateWebhook()`
- **Problem**: None of these are imported anywhere in views or hooks
- **Fix**: Delete the file, or implement the merchant management UI

#### #6 — Very large components should be split
- **Files**:
  - `src/views/invoices/InvoicePaymentV2.jsx` — **1,280 lines** (payment flow state machine)
  - `src/views/admin/EVMFeePolicy.jsx` — **1,068 lines** (fee policy forms)
  - `src/views/admin/WithdrawalPolicy.jsx` — **779 lines** (withdrawal policy management)
  - `src/views/app/DashboardLayout.jsx` — **785 lines** (acceptable — layout wrapper)
- **Problem**: Components >600 lines are hard to maintain, test, and review
- **Fix**: Extract sub-components (e.g., payment steps, fee form sections, policy tabs)

#### #7 — Auth header inconsistency in notifications.ts
- **File**: `src/api/notifications.ts` — lines 42, 78, 97, 111, 127
- **Problem**: Uses `extractToken()` directly to build auth headers, while all other API files use `toAuthHeader()` helper from client.ts
- **Fix**: Refactor to use `toAuthHeader()` for consistency

#### #8 — Missing x-request-id header
- **Files**:
  - `src/api/twoFactor.ts` — 5 functions (lines 47, 61, 75, 90, 105)
  - `src/api/navigation.ts` — line 22
- **Problem**: Other API files (invoices, wallets, withdrawals, auth) include `x-request-id` header for traceability. These files don't.
- **Fix**: Import `requestId` and add the header

#### #9 — Two invoice payment routes with unclear versioning
- **Routes**:
  - `/pay/:id` → `InvoicePaymentV2.jsx` (1,280 lines, active)
  - `/pay-v2/:id` → `InvoicePayment.jsx` (legacy)
- **Problem**: Route naming is backwards. `/pay/:id` points to the V2 component.
- **Fix**: Clarify which is current. Consider removing the legacy route/component.

---

### MEDIUM

#### #10 — Hardcoded colors break dark mode (40+ files)
- **Examples**:
  - `src/views/invoices/PaySelect.jsx` — 40+ hardcoded colors (`#1e293b`, `#64748b`, `#C6F432`)
  - `src/views/invoices/InvoicePaymentV2.jsx` — 60+ hardcoded colors
  - `src/views/withdrawals/WithdrawalTransactions.jsx:585,645` — `backgroundColor: '#f8f9fa'`
  - `src/views/withdrawals/WithdrawalAddressDetail.jsx:407` — `backgroundColor: '#f8f9fa'`
  - `src/views/ledger/IncomeStatement.jsx:427,444` — `color: '#a8aaae'`, `color: '#696cff'`
  - `src/views/balance/WithdrawRequest.jsx:491` — `backgroundColor: '#C6F432'`
- **Problem**: These won't adapt when dark mode is toggled via `data-bs-theme`
- **Fix**: Use Bootstrap/Sneat theme classes (`bg-body-secondary`, `text-muted`, `border-light`, `bg-label-*`)

#### #11 — Inconsistent API return patterns (6 different patterns)
- **Patterns found across api/ files**:
  1. `response?.data || response` (merchant.ts, admin.ts)
  2. `response?.data?.wallet ?? response?.wallet ?? response?.data ?? response` (wallets.ts)
  3. `res?.data?.invoice ?? res?.invoice ?? res?.data ?? res` (invoices.ts)
  4. `(res as any)?.data || {}` (balance.ts)
  5. `res?.data || res` (notifications.ts)
  6. `data.data || data` (admin.ts some functions)
- **Fix**: Standardize to `res?.data ?? res`

#### #12 — Inconsistent pagination meta fallback order in admin.ts
- **Functions affected** (6):
  - `getCoins()` — `meta.page || 1`
  - `getNetworks()` — `meta.page || 1`
  - `getGasTopups()` — `meta.page || meta.currentPage || 1`
  - `getWithdrawalAddresses()` — `meta.page || meta.currentPage || 1`
  - `getMerchants()` — `meta.currentPage || meta.page || 1`
  - `getUsers()` — `meta.currentPage || meta.page || 1`
- **Fix**: Standardize to `meta.currentPage || meta.page || 1`

#### #13 — Mock data in production
- **File**: `src/views/balance/mockBalanceData.js`
- **Problem**: Imported by `Balance.jsx` in production. Contains `MOCK_COINS` and `MOCK_BALANCE_DATA`.
- **Fix**: Move to test fixtures directory, or remove if real API is ready

#### #14 — Duplicate formatDate functions
- **Files**:
  - `src/views/admin/MerchantList.jsx` — local `formatDate()`
  - `src/views/admin/UserList.jsx` — local `formatDate()`
  - `src/views/merchant/MerchantSettings.jsx` — local `formatDate()`
- **Problem**: Same logic duplicated. `src/utils/format.ts` already has date formatting utilities.
- **Fix**: Extract to `utils/format.ts` as `formatDateSimple()` and import

#### #15 — Duplicate formatRoleLabel in UserList.jsx
- **File**: `src/views/admin/UserList.jsx` — has local `formatRoleLabel()`
- **Problem**: `src/utils/roles.js` already exports `formatRoleLabel()`
- **Fix**: Remove local copy, import from `utils/roles.js`

#### #16 — Common loading/error pattern repeated in 20+ files
- **Pattern**: Every view file repeats:
  ```jsx
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  useEffect(() => { loadData() }, [])
  async function loadData() {
    try { setLoading(true); ... } catch(e) { setError(e) } finally { setLoading(false) }
  }
  ```
- **Fix**: Extract to `src/hooks/useAsyncData.js` custom hook

---

### LOW

#### #17 — Backup landing pages (dead code)
- **Files**: `src/backup/LandingPageV2.jsx`, `LandingPageV3.jsx`, `LandingPageV4.jsx` + CSS
- **Problem**: Not imported anywhere. Only `src/views/landing/LandingPage.jsx` is used.
- **Fix**: Safe to delete (versioning handled via git)

#### #18 — PaySelect.jsx has unimplemented TODO
- **File**: `src/views/invoices/PaySelect.jsx`
- **Comment**: `// TODO: Navigate or call API to select this coin for payment`
- **Fix**: Implement or remove if no longer needed

#### #19 — AdminDashboard.jsx ambiguity
- **Files**: `src/views/admin/AdminDashboard.jsx` vs `src/views/admin/Dashboard.jsx`
- **Problem**: Only `Dashboard.jsx` is imported in DashboardLayout. AdminDashboard may be dead code.
- **Fix**: Verify and delete if unused

#### #20 — Locale file consistency
- **File sizes**: en (1,294 lines), th (1,354 lines), zh (1,327 lines)
- **Problem**: Sizes differ — some keys may be missing or extra in certain languages
- **Fix**: Run diff to verify all EN keys exist in TH and ZH

#### #21 — TypeScript type safety
- **Files**: Multiple `any` return types across API functions
  - `wallets.ts:179` — `verifyWalletAddress()` returns `Promise<any>`
  - `admin.ts:806,829` — `approveWithdrawal()`, `rejectWithdrawal()` no return type
  - `balance.ts:81,106` — `(res as any)?.data`
- **Fix**: Define proper response interfaces

---

## Already Good (No Changes Needed)

### Utilities
| File | Status | Notes |
|------|--------|-------|
| `amount_normalizer.ts` | Excellent | Comprehensive chain support, well-tested |
| `clipboard.ts` | Excellent | Modern API + legacy fallback, used in 24 files |
| `format.ts` | Very Good | formatUsd, formatCrypto, trailing zero trimming |
| `coinAssets.ts` | Good | Centralized mapping with fallback |
| `authToken.ts` | Good | Handles multiple token field names |
| `roles.js` | Good | Shared constants, used by AdminRoles + RolePermissions |

### Hooks
| File | Status | Notes |
|------|--------|-------|
| `use2FAStatus.js` | Well-designed | Proper state management, computed props, JSDoc |
| `useInvoiceEvents.js` | Excellent | 3 hooks, proper cleanup, useRef for callbacks |
| `useToast.js` | Good | Simple, effective state management |

### Components
| File | Status | Notes |
|------|--------|-------|
| `CoinImg.jsx` | Excellent | Fallback avatar, network badge, dynamic loading |
| `ErrorBoundary.jsx` | Excellent | App-wide, custom fallback UI |
| `ConfirmModal.jsx` | Good | Bootstrap integration, loading state |
| `LocaleDatePicker.jsx` | Very Good | Locale-aware, min/max constraints |
| `LocaleDateRangePicker.jsx` | Very Good | Two-phase selection, range highlighting |
| `Verify2FAModal.jsx` | Excellent | TOTP + backup codes, auto-focus, paste support |
| `DeleteConfirmModal.jsx` | Good | Proper i18n, loading state |
| `Toast.jsx` | Good | Type-based styling, auto-close |

### Security
| Check | Result |
|-------|--------|
| XSS (dangerouslySetInnerHTML) | 0 usages found |
| console.log in production | None (only console.error for debugging) |
| SQL injection risk | N/A (client-side only) |
| Sensitive data in localStorage | Token stored (standard JWT pattern) |

### Performance
| Metric | Value |
|--------|-------|
| Main bundle | ~580 kB (from 1,493 kB pre-refactor) |
| Lazy-loaded routes | 55 |
| Promise.all for parallel fetches | Used correctly in all cases |
| Code splitting | All authenticated + public routes lazy-loaded |

---

## Summary Statistics

| Category | Count |
|----------|-------|
| Total issues found | 21 |
| Critical | 3 (dead code, duplicate files) |
| High | 6 (unused code, large components, inconsistencies) |
| Medium | 7 (dark mode, patterns, duplication) |
| Low | 5 (cleanup, locale, types) |
| Files with zero issues | ~90 (utilities, hooks, components) |

### Estimated Effort

| Priority | Items | Effort |
|----------|-------|--------|
| Quick wins (delete dead code) | #1, #2, #3, #5, #17 | ~15 min |
| Medium fixes (clipboard, headers, duplicates) | #4, #7, #8, #14, #15 | ~1-2 hours |
| Larger refactors (dark mode, split components, hooks) | #6, #10, #16 | ~1-2 days |
| Full standardization (API patterns, types, locales) | #11, #12, #20, #21 | ~1 day |

---

**Overall Grade: B+**
Architecture is solid (A-). Main debt is dark mode colors (40+ files), a few large components, and dead code cleanup. No security issues. No architectural red flags.
