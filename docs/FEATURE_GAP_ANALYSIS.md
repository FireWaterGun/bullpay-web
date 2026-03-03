# BullPay — Feature & Report Gap Analysis vs Industry

> **Date:** March 4, 2026
> **Compared against:** BitPay, CoinGate, NOWPayments, Coinbase Commerce

---

## 1. Current Feature Inventory

### Authentication & Security

| Feature                    | Status | Notes                             |
| -------------------------- | ------ | --------------------------------- |
| Email + Password login     | ✅     | With Cloudflare Turnstile captcha |
| 2FA (TOTP) + backup codes  | ✅     | Setup/disable/backup download     |
| Email verification         | ✅     | Token-based                       |
| Forgot / Reset password    | ✅     | Email flow with confirmation page |
| Idle auto-logout           | ✅     | Configurable inactivity timeout   |
| Change password (with 2FA) | ✅     | Forces logout on all devices      |

### Invoice Management

| Feature                  | Status | Notes                                                  |
| ------------------------ | ------ | ------------------------------------------------------ |
| Create invoice           | ✅     | Coin/network, amount, description, memo, expiry        |
| Invoice list + filters   | ✅     | Status, coin/network, date range, amount range, search |
| Invoice detail           | ✅     | Status badge, payments table, actions                  |
| Real-time invoice events | ✅     | Pusher WebSocket — instant status updates              |
| Public payment page      | ✅     | QR code, address, countdown timer, status tracking     |
| Multi-network pay-select | ✅     | Network chooser for multi-network invoices             |

### Balance & Wallet

| Feature                        | Status | Notes                                      |
| ------------------------------ | ------ | ------------------------------------------ |
| Per-asset balance breakdown    | ✅     | Confirmed, unconfirmed, locked + USD value |
| Wallet view with coin grouping | ✅     | Network labels, deposit/withdraw actions   |
| Show/hide zero balances        | ✅     | Toggle filter                              |

### Withdrawal

| Feature                  | Status | Notes                                                        |
| ------------------------ | ------ | ------------------------------------------------------------ |
| Withdrawal address CRUD  | ✅     | Create, edit, delete, email verification                     |
| Withdrawal request       | ✅     | Address select, amount, fee estimate, 2FA required           |
| Fee estimate preview     | ✅     | Real-time: base fee + percent fee + total + net + USD        |
| Withdrawal list + filter | ✅     | Status filter (pending/processing/completed/failed/rejected) |
| Withdrawal detail        | ✅     | Full transaction info                                        |

### Reports & Analytics (User)

| Feature                   | Status | Notes                                              |
| ------------------------- | ------ | -------------------------------------------------- |
| Transaction summary cards | ✅     | Total received, withdrawals, fees, net + change %  |
| Daily trend chart         | ✅     | Custom SVG bar + line chart                        |
| Transaction by coin table | ✅     | Per coin/network breakdown                         |
| Date range presets        | ✅     | Today, yesterday, 7d, 30d, this/last month, custom |
| User ledger               | ✅     | Double-entry ledger with full filters              |

### Merchant / API Integration

| Feature                        | Status | Notes                                     |
| ------------------------------ | ------ | ----------------------------------------- |
| Merchant registration          | ✅     | Name, email, website, callback URL        |
| API key + masked secret        | ✅     | Copy to clipboard                         |
| Rotate secret / Regenerate key | ✅     | Password + optional 2FA required          |
| Webhook URL management         | ✅     | Update with password + 2FA                |
| Merchant stats                 | ✅     | Invoice count, total received, commission |

### Settings & Personalization

| Feature                       | Status | Notes                      |
| ----------------------------- | ------ | -------------------------- |
| Profile (name, email)         | ✅     | Editable                   |
| Timezone selector (30+ zones) | ✅     | Live clock preview         |
| Language (EN/TH/ZH)           | ✅     | Full i18n coverage         |
| Change password               | ✅     | With 2FA verification      |
| 2FA management                | ✅     | Enable/disable with modals |

### Notifications

| Feature                        | Status | Notes                                       |
| ------------------------------ | ------ | ------------------------------------------- |
| In-app notification dropdown   | ✅     | Real-time via Pusher                        |
| Mark read / Mark all read      | ✅     | Individual + batch                          |
| 7 notification event types     | ✅     | deposit, withdrawal, payment, sweep, system |
| Transactional emails (backend) | ✅     | 8 email types via Mailgun                   |

### Infrastructure Strengths

| Feature                       | Status | Notes                              |
| ----------------------------- | ------ | ---------------------------------- |
| Multi-chain (EVM/BTC/SOL/TRX) | ✅     | 4 chain families, 50+ coins        |
| Atomic Redis operations (Lua) | ✅     | All balance mutations atomic       |
| Double-entry ledger           | ✅     | User + system ledger               |
| Real-time WebSocket events    | ✅     | Pusher with 10+ event types        |
| BullMQ background jobs        | ✅     | Watchers, sweeps, notifications    |
| HD Wallets + AWS KMS          | ✅     | Enterprise-grade key management    |
| Maintenance mode              | ✅     | Graceful + instant Pusher recovery |

---

## 2. Gap Analysis — What's Missing vs Industry

### Priority 1 — Critical Gaps (ทุกคู่แข่งมี)

| #     | Feature                                                                                   | Who Has It                                           | Impact                                                                            |
| ----- | ----------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------------- |
| **1** | **CSV/Excel Export** — Export ข้อมูลจากทุกตาราง (invoices, payments, withdrawals, ledger) | BitPay, CoinGate, NOWPayments                        | **สูงมาก** — User/Merchant ดึงข้อมูลออกไปทำบัญชี, audit, หรือ reconcile ไม่ได้เลย |
| **2** | **Invoice PDF / Receipt** — Download invoice เป็น PDF สำหรับ print หรือ archive           | BitPay, Coinbase Commerce                            | **สูง** — ไม่มี printable tax record, ลูกค้าขอ receipt ไม่ได้                     |
| **3** | **Settlement / Payout Report** — สรุปยอดที่จ่ายเข้า wallet รายวัน/สัปดาห์/เดือน           | BitPay (Settlement Ledger), CoinGate (Payout Report) | **สูง** — Merchant reconcile balance กับ bank statement ไม่ได้                    |
| **4** | **Merchant Webhook Logs** — Merchant เห็น delivery history + retry ของ webhook ตัวเอง     | CoinGate, NOWPayments                                | **สูง** — Merchant debug integration ไม่ได้ ต้องพึ่ง admin ทุกครั้ง               |

### Priority 2 — Strong Differentiators (ทำให้โดดเด่น)

| #     | Feature                                                                                   | Who Has It                                   | Impact                                                                      |
| ----- | ----------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------------------------------------- |
| **5** | **Login / Session History** — User เห็นว่า login จากที่ไหน เมื่อไหร่ + revoke session ได้ | Coinbase, Binance, ทุก exchange              | **กลาง-สูง** — ขาดด้าน security transparency, เป็น compliance best practice |
| **6** | **Notification Preferences** — Toggle on/off แต่ละ event (email / push)                   | BitPay, CoinGate                             | **กลาง** — User customize ไม่ได้ → อาจ spam หรือ miss critical alert        |
| **7** | **Payment Link / Payment Button** — สร้าง reusable link หรือ embed button ไม่ต้อง code    | CoinGate, NOWPayments, Coinbase Commerce     | **กลาง-สูง** — พ่อค้าที่ไม่ tech ใช้งานไม่ได้ ต้องมี developer เสมอ         |
| **8** | **Auto-conversion / Fiat Settlement** — Auto-convert crypto → stablecoin / fiat           | BitPay (auto-settle USD), CoinGate (EUR/USD) | **กลาง** — ผู้ใช้รับ volatility risk เอง                                    |

### Priority 3 — Nice to Have (ยกระดับ)

| #      | Feature                                                                   | Who Has It                | Impact                                                                |
| ------ | ------------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------- |
| **9**  | **API Docs Portal** — Interactive Swagger / OpenAPI docs online           | BitPay, NOWPayments       | **กลาง** — Developer ต้องถาม support แทนที่จะ self-serve              |
| **10** | **Chart Interactivity** — Tooltip, zoom, drill-down on charts             | ทุกรายที่ใช้ charting lib | **ต่ำ** — Custom SVG ดูได้แต่ interact ไม่ได้                         |
| **11** | **Multi-currency Invoice** — 1 invoice รับได้หลาย coin                    | NOWPayments, CoinGate     | **กลาง** — ปัจจุบัน 1 invoice = 1 coin-network ลิมิตตัวเลือกลูกค้า    |
| **12** | **Recurring Invoice / Subscription** — Auto-generate invoice ตาม schedule | Coinbase Commerce, BitPay | **กลาง** — ไม่รองรับ recurring payment model (SaaS, membership)       |
| **13** | **Sub-account / Team** — เพิ่ม team member + permission แยก               | BitPay, Coinbase Commerce | **กลาง** — 1 account = 1 user เท่านั้น, ไม่เหมาะกับ business ที่มีทีม |
| **14** | **IP Allowlist (API)** — จำกัด IP ที่เรียก API ได้                        | BitPay, CoinGate          | **กลาง** — API key ถูกขโมย → ไม่มี IP guard                           |
| **15** | **Refund Management** — Issue refund กลับ customer                        | BitPay, Coinbase Commerce | **กลาง** — ไม่มี refund workflow ทั้งหมด                              |

---

## 3. Technical Debt & Cleanup

| Item                                | Detail                                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Unused ApexCharts**               | CSS/JS loaded via Sneat theme layout แต่ไม่ได้ใช้ — เป็น dead weight                                        |
| **No server-side export endpoints** | Controllers return JSON only — ต้องเพิ่ม CSV/PDF endpoints                                                  |
| **Activity data exists but no UI**  | `UserActivity` entity + repository มีใน API แต่ไม่มี frontend page                                          |
| **COMMON_TIMEZONES duplicated**     | Array เหมือนกันอยู่ทั้ง `settings/page.jsx` และ `admin/account/page.jsx` — ควร extract เป็น shared constant |

---

## 4. Recommended Roadmap

### Phase 1 — Data Export (High impact, ทำได้เร็ว)

```
Week 1-2:
├── API: CSV export endpoints สำหรับ invoices, payments, withdrawals, ledger
├── Web: "Export CSV" button บนทุกตาราง
├── API: Invoice PDF generation endpoint (jsPDF / Puppeteer)
└── Web: "Download PDF" button บน invoice detail
```

**ผลลัพธ์:** User/Merchant ดึงข้อมูลออกมาใช้ได้ → ปิด gap ใหญ่สุดทันที

### Phase 2 — Merchant Experience (Business value)

```
Week 3-5:
├── Merchant-facing webhook delivery log page
├── Settlement/Payout report (daily/weekly/monthly summary)
├── Payment Link creation UI (no-code payment)
└── Payment Button embed code generator
```

**ผลลัพธ์:** Merchant self-serve ได้มากขึ้น, ลด support load

### Phase 3 — Security & UX (Trust building)

```
Week 6-8:
├── Login/Session history page (show IP, device, time)
├── Session revoke functionality
├── Notification preferences settings page
├── IP allowlist for API keys
└── Extract COMMON_TIMEZONES to shared constant
```

**ผลลัพธ์:** สร้างความเชื่อมั่นด้าน security, ลด noise

### Phase 4 — Advanced Features (Scale & compete)

```
Week 9-12+:
├── Auto-conversion to stablecoin/fiat
├── Interactive charts (migrate to Recharts/ApexCharts)
├── Multi-currency invoice
├── Recurring invoice / subscription billing
├── Sub-account / team management + RBAC
├── Refund management workflow
└── API docs portal (Swagger UI)
```

**ผลลัพธ์:** Feature parity กับ BitPay/CoinGate ทุกจุด

---

## 5. Competitive Positioning Summary

```
                    BullPay    BitPay    CoinGate    NOWPayments    Coinbase Commerce
Infrastructure       ★★★★★     ★★★★      ★★★★        ★★★            ★★★★★
Real-time Events     ★★★★★     ★★★       ★★★         ★★★            ★★★
Multi-chain          ★★★★      ★★★★★     ★★★★        ★★★★★          ★★★
Data Export          ☆          ★★★★★     ★★★★        ★★★★           ★★★★
Reports/PDF          ☆          ★★★★★     ★★★★        ★★★            ★★★★
Developer Tools      ★★★       ★★★★★     ★★★★        ★★★★★          ★★★★
No-code Payments     ☆          ★★★★      ★★★★★       ★★★★★          ★★★★★
Refunds              ☆          ★★★★★     ★★★         ★★             ★★★★★
Auto-conversion      ☆          ★★★★★     ★★★★        ☆              ★★★★
Team/Sub-accounts    ☆          ★★★★      ★★★         ☆              ★★★★

Legend: ★★★★★ = Best-in-class  ★★★ = Average  ☆ = Missing
```

**BullPay มี infrastructure ดีเยี่ยม แต่ขาด "output layer" — ปิด Phase 1-2 จะก้าวข้ามคู่แข่งระดับกลางได้ทันที**
