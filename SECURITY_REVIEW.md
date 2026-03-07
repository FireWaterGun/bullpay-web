# Security Review — Bull Pay Web

**Date:** 2026-02-22
**Scope:** Full frontend security audit (Auth, XSS, API, Dependencies, Config)
**Total Findings:** 26 (4 Critical, 8 High, 10 Medium, 4 Low)

---

## CRITICAL

### 1. Open Redirect via `successUrl`

- **Files:** `src/views/invoices/InvoicePayment.jsx`, `InvoicePaymentV2.jsx`
- **Risk:** Attacker set `successUrl` เป็น malicious site เพื่อ phish ผู้ใช้หลังจ่ายเงินสำเร็จ
- **Detail:** `successUrl` จาก invoice data ถูก `window.location.href` redirect โดยไม่ validate origin
- **Fix:**
  ```js
  const ALLOWED_DOMAINS = ['yourdomain.com']
  function isSafeRedirect(url) {
    try {
      const parsed = new URL(url, window.location.origin)
      return parsed.origin === window.location.origin || ALLOWED_DOMAINS.includes(parsed.hostname)
    } catch {
      return false
    }
  }
  // ใช้ก่อน redirect
  if (invoice.successUrl && isSafeRedirect(invoice.successUrl)) {
    window.location.href = invoice.successUrl
  }
  ```

### 2. JWT Token เก็บใน localStorage

- **File:** `src/context/AuthContext.jsx`
- **Risk:** ถ้า XSS สำเร็จแม้แต่ครั้งเดียว token จะถูกขโมยได้ทันที
- **Detail:** Token เก็บใน `localStorage('auth_token')` — JavaScript อ่านได้ทุกเมื่อ, ไม่มี token expiry check ฝั่ง client
- **Fix:** ย้ายไปใช้ `httpOnly` cookie จาก backend (ต้องเปลี่ยนทั้ง frontend + backend) หรืออย่างน้อยเพิ่ม token expiry validation ฝั่ง client

### 3. ไม่มี Token Refresh Mechanism

- **Files:** `src/api/client.ts`, `src/context/AuthContext.jsx`
- **Risk:** Long-lived token เพิ่มความเสี่ยงหาก token ถูกขโมย, user ถูก force logout กะทันหัน
- **Detail:** ไม่มี refresh token flow — เมื่อ token expire จะ 401 แล้ว force logout ทันที โดยไม่มี warning
- **Fix:** Implement refresh token rotation (backend) + silent refresh (frontend)

### 4. i18n `escapeValue: false` Template Injection

- **Files:** หลายไฟล์ที่ใช้ `t('key', { interpolation: { escapeValue: false } })`
- **Risk:** ถ้า translation value มาจาก user input หรือ API → XSS ได้
- **Detail:** ปัจจุบันใช้กับ static translations → ความเสี่ยงจริงต่ำ แต่ pattern อันตรายที่อาจเผลอใช้ผิด
- **Fix:** ลบ `escapeValue: false` ออกทุกที่ที่ไม่จำเป็น หรือใช้ `<Trans>` component แทน

---

## HIGH

### 5. Client-side RBAC เท่านั้น

- **File:** `src/context/AuthContext.jsx`
- **Risk:** User สามารถเรียก admin API ตรงได้ถ้า backend ไม่ enforce
- **Detail:** `hasPermission()`, `hasMenu()`, `isAdmin` check อยู่ฝั่ง client เท่านั้น — เป็นแค่ UI guard
- **Fix:** ตรวจสอบว่า backend enforce RBAC ทุก endpoint (middleware level)

### 6. 2FA Disable ใช้แค่ Password

- **File:** `src/api/twoFactor.ts`
- **Risk:** ถ้า password leak → attacker ปิด 2FA ได้ทันที
- **Detail:** API `disable2FA()` ส่งแค่ password — ไม่ต้องใส่ TOTP code เพื่อยืนยัน
- **Fix:** Require TOTP code เพื่อ disable 2FA (backend change)

### 7. CORS Credentials โดยไม่ validate Origin

- **File:** `src/api/client.ts`
- **Risk:** Cookie leak ถ้า backend set `Access-Control-Allow-Origin: *`
- **Detail:** `credentials: 'include'` ใน fetch options — cookies ถูกส่งทุก request
- **Fix:** ตรวจสอบว่า backend set `Access-Control-Allow-Origin` เป็น specific domain (ไม่ใช่ `*`) และใช้ `Access-Control-Allow-Credentials: true`

### 8. ไม่มี CSRF Protection

- **Risk:** Cross-site request forgery ถ้าใช้ cookie-based auth
- **Detail:** ไม่มี CSRF token ใน requests, ไม่มี `SameSite` cookie attribute
- **Fix:** เพิ่ม CSRF token (backend) หรือใช้ `SameSite=Strict` cookie, หรือใช้ custom header (เช่น `X-Requested-With`)

### 9. Merchant Credentials แสดงโดยไม่ mask

- **File:** `src/views/merchant/MerchantSettings.jsx`
- **Risk:** API keys, webhook secrets ถูกเห็นโดย shoulder surfing หรือ screen recording
- **Detail:** Credentials แสดงเต็มใน UI, copy to clipboard โดยไม่มี confirmation
- **Fix:** Mask credentials default (แสดงแค่ 4 ตัวท้าย), require click to reveal, auto-hide หลัง 30 วินาที

### 10. Pusher อนุญาต Unencrypted WebSocket

- **File:** `src/context/PusherContext.jsx`
- **Risk:** Real-time data (payment notifications, invoice updates) ถูก intercept ได้
- **Detail:** `forceTLS` อ่านจาก env var — ถ้าไม่ set จะใช้ `ws://` แทน `wss://`
- **Fix:**
  ```js
  // Default to true in production
  forceTLS: import.meta.env.VITE_PUSHER_FORCE_TLS !== 'false'
  ```

### 11. Dev Server Bind All Interfaces

- **File:** `vite.config.js`
- **Risk:** บน public/shared network → ใครก็เข้าถึง dev server ได้
- **Detail:** `host: true` — dev server bind `0.0.0.0` เปิดให้ทุก network interface
- **Fix:** ใช้ `host: true` เฉพาะเมื่อต้องการ, หรือ bind เฉพาะ `localhost`

### 12. ไม่มี Content Security Policy (CSP)

- **File:** `index.html`
- **Risk:** XSS mitigation ลดลง — ไม่มี defense-in-depth
- **Detail:** ไม่มี CSP header หรือ meta tag
- **Fix:**
  ```html
  <meta
    http-equiv="Content-Security-Policy"
    content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.yourdomain.com wss://ws.yourdomain.com;"
  />
  ```

---

## MEDIUM

### 13. ไม่มี Rate Limiting ฝั่ง Client สำหรับ Login

- **File:** `src/api/auth.ts`
- **Risk:** Brute force attack ถ้า backend ไม่มี rate limit
- **Detail:** Login form ไม่มี client-side throttle หรือ lockout
- **Fix:** เพิ่ม delay หลัง failed attempts + ตรวจสอบ backend rate limiting

### 14. Session ไม่ Invalidate เมื่อ Change Password

- **File:** `src/context/AuthContext.jsx`
- **Risk:** Session เก่ายังใช้งานได้หลังเปลี่ยน password
- **Detail:** Change password ไม่ได้ logout all sessions / invalidate old tokens
- **Fix:** Backend ควร invalidate all tokens เมื่อ change password, frontend ควร re-login

### 15. Error Messages อาจ Leak Internal Info

- **File:** `src/api/client.ts`
- **Risk:** `error.details` อาจมี stack trace, SQL error, internal paths
- **Detail:** `ApiError` ส่ง `details` field ตรงจาก backend response ให้ UI แสดง
- **Fix:** Backend ควร sanitize error messages, frontend ควรแสดงแค่ generic message ใน production

### 16. ไม่มี X-Frame-Options / frame-ancestors

- **File:** `index.html`
- **Risk:** Clickjacking — attacker embed app ใน iframe แล้วหลอก user click
- **Detail:** ไม่มี `X-Frame-Options` header หรือ CSP `frame-ancestors`
- **Fix:** เพิ่มใน CSP: `frame-ancestors 'self'` หรือ set header `X-Frame-Options: DENY` (backend/CDN)

### 17. Clipboard Data ไม่ Clear หลัง Copy

- **File:** `src/utils/clipboard.ts`
- **Risk:** Sensitive data (API keys, wallet addresses) อยู่ใน clipboard นานเกินไป
- **Detail:** Copy to clipboard ไม่มี auto-clear mechanism
- **Fix:** เพิ่ม optional auto-clear หลัง 60 วินาทีสำหรับ sensitive data

### 18. Admin Endpoints ไม่ Confirm Destructive Actions

- **Files:** Admin views (`AdminInvoiceDetail.jsx`, `WithdrawalAddressDetail.jsx`, etc.)
- **Risk:** Accidental approve/reject/delete
- **Detail:** บาง destructive actions (approve withdrawal, delete address) ไม่มี double confirmation
- **Fix:** เพิ่ม confirmation modal สำหรับ destructive actions ที่มีผลกระทบสูง

### 19. Console.error ใน Production

- **Files:** ทั่วไป (API calls, hooks)
- **Risk:** Internal info leak ผ่าน browser console
- **Detail:** `console.error` ทั่ว codebase — อาจแสดง API URLs, error details, internal state
- **Fix:** ใช้ logging library ที่ strip console logs ใน production build

### 20. Invoice Polling ไม่มี Max Retry

- **File:** `src/views/invoices/InvoicePaymentV2.jsx`
- **Risk:** Infinite polling ถ้า server ไม่ตอบ status change → resource waste
- **Detail:** Polling loop ไม่มี maximum retry count หรือ timeout
- **Fix:** เพิ่ม max retry (เช่น 300 ครั้ง = 5 นาที) หรือ exponential backoff

### 21. ไม่มี Subresource Integrity (SRI) สำหรับ External Scripts

- **File:** `index.html`
- **Risk:** ถ้า CDN ถูก compromise → malicious script execute ได้
- **Detail:** External scripts/styles ไม่มี `integrity` attribute
- **Fix:** เพิ่ม `integrity` + `crossorigin` attribute สำหรับ external resources

### 22. localStorage ไม่มี Encryption

- **File:** `src/context/AuthContext.jsx`
- **Risk:** Token อ่านได้ plaintext จาก browser DevTools หรือ extensions
- **Detail:** `auth_token`, `auth_user`, `auth_navigation` เก็บ plaintext ใน localStorage
- **Fix:** ใช้ session-based encryption หรือย้ายไป httpOnly cookie (ดู #2)

---

## LOW

### 23. ไม่มี Auto-logout on Idle

- **File:** `src/context/AuthContext.jsx`
- **Risk:** Session เปิดค้างบน shared computer
- **Detail:** ไม่มี idle timeout — session อยู่จนกว่า token expire หรือ user logout
- **Fix:** เพิ่ม idle detection (เช่น 30 นาที) แล้ว prompt re-auth

### 24. ไม่มี Client-side Audit Log สำหรับ Admin Actions

- **Files:** Admin views
- **Risk:** ไม่มี trace ของ admin actions ฝั่ง client
- **Detail:** Admin ทำ action (approve, reject, delete) โดยไม่มี local audit trail
- **Fix:** Log admin actions ไปที่ backend audit endpoint (ถ้ายังไม่มี)

### 25. Source Maps อาจ Enable ใน Production

- **File:** `vite.config.js`
- **Risk:** Source code ถูกอ่านได้จาก production bundle
- **Detail:** ไม่ได้ explicitly disable source maps สำหรับ production build
- **Fix:** เพิ่ม `build: { sourcemap: false }` ใน vite.config.js

### 26. Package.json ไม่ Lock Exact Versions

- **File:** `package.json`
- **Risk:** Supply chain attack ผ่าน compromised minor/patch version
- **Detail:** Dependencies ใช้ `^` (caret range) — อาจ install version ใหม่ที่ถูก compromise
- **Fix:** ใช้ `package-lock.json` (มีอยู่แล้ว) + พิจารณา `npm audit` ใน CI

---

## Verified Secure

สิ่งที่ตรวจแล้วปลอดภัย:

- ไม่มี `dangerouslySetInnerHTML` ในทั้ง codebase
- ไม่มี `eval()`, `new Function()`, `document.write()`
- API layer ใช้ `JSON.stringify` สำหรับ body — ไม่มี injection risk ฝั่ง client
- Clipboard utility ใช้ Clipboard API + legacy fallback อย่างถูกต้อง
- Route guards (`ProtectedRoute`) ครอบทุก authenticated route
- Environment variables ใช้ `VITE_` prefix — ไม่ leak server secrets
- ไม่มี inline event handlers (`onclick=`, `onerror=`) ใน HTML
- Form inputs ใช้ React controlled components — ไม่มี DOM manipulation ตรง

---

## Priority Matrix

| Priority         | Issues                                                | Action                     |
| ---------------- | ----------------------------------------------------- | -------------------------- |
| **ทำทันที**      | #1 Open Redirect, #10 Pusher forceTLS                 | Fix ง่าย, impact สูง       |
| **สำคัญมาก**     | #4 escapeValue, #12 CSP, #9 Mask credentials          | Frontend-only fix          |
| **วางแผนทำ**     | #2 #3 JWT/Cookie, #6 2FA, #14 Session                 | ต้องเปลี่ยน backend        |
| **ตรวจ Backend** | #5 RBAC, #7 CORS, #8 CSRF, #13 Rate limit             | Frontend ทำได้แค่ส่วนหนึ่ง |
| **Nice to have** | #23 Idle logout, #25 Source maps, #17 Clipboard clear | Low risk                   |
