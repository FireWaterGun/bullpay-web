import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { useToastContext } from '../../context/ToastContext'
import { useUserInvoiceEvents, useSystemNotifications } from '../../hooks/useInvoiceEvents'
import { notifyPaymentReceived, playNotificationSound, initAudioContext } from '../../utils/notification'
import { getSystemWalletStats, getWithdrawals } from '../../api/admin.ts'
import { formatUsd } from '../../utils/format'
import { getBalancesWithFiat } from '../../api/balance.ts'
// Layout components (eager — always visible)
import { MenuItem, SubItem, MenuGroup } from './SidebarMenu'
import NotificationDropdown from './NotificationDropdown'
// Page components (lazy — loaded on navigation)
const UserTransactionsDashboard = lazy(() => import('./UserTransactionsDashboard'))
const Settings = lazy(() => import('./Settings'))
const WalletCreate = lazy(() => import('../wallets/WalletCreate'))
const WalletEdit = lazy(() => import('../wallets/WalletEdit'))
const WalletVerify = lazy(() => import('../wallets/WalletVerify'))
const InvoiceList = lazy(() => import('../invoices/InvoiceList'))
const InvoiceCreate = lazy(() => import('../invoices/InvoiceCreate'))
const InvoiceDetail = lazy(() => import('../invoices/InvoiceDetail'))
const InvoicePayment = lazy(() => import('../invoices/InvoicePayment'))
const BalanceAccount = lazy(() => import('../balance/BalanceAccount'))
const BalanceWithdrawals = lazy(() => import('../balance/BalanceWithdrawals'))
const WithdrawRequest = lazy(() => import('../balance/WithdrawRequest'))
const WithdrawalDetail = lazy(() => import('../balance/WithdrawalDetail'))
const RevenueDashboard = lazy(() => import('../admin/RevenueDashboard'))
const SystemBalance = lazy(() => import('../admin/SystemBalance'))
const WalletTransaction = lazy(() => import('../admin/WalletTransaction'))
const CoinList = lazy(() => import('../crypto/CoinList'))
const CoinForm = lazy(() => import('../crypto/CoinForm'))
const NetworkList = lazy(() => import('../crypto/NetworkList'))
const NetworkForm = lazy(() => import('../crypto/NetworkForm'))
const SupportedCrypto = lazy(() => import('../crypto/SupportedCrypto'))
const SupportedCryptoForm = lazy(() => import('../crypto/SupportedCryptoForm'))
const Sweep = lazy(() => import('../admin/Sweep'))
const SweepOverrides = lazy(() => import('../admin/SweepOverrides'))
const SweepTransactions = lazy(() => import('../admin/SweepTransactions'))
const GasTopups = lazy(() => import('../admin/GasTopups'))
const GasTopupDetail = lazy(() => import('../admin/GasTopupDetail'))
const SweepDetail = lazy(() => import('../admin/SweepDetail'))
const WithdrawalDefaults = lazy(() => import('../admin/WithdrawalDefaults'))
const WithdrawalOverrides = lazy(() => import('../admin/WithdrawalOverrides'))
const WithdrawalPolicy = lazy(() => import('../admin/WithdrawalPolicy'))
const WithdrawalTransactions = lazy(() => import('../withdrawals/WithdrawalTransactions'))
const WithdrawalAddresses = lazy(() => import('../withdrawals/WithdrawalAddresses'))
const WithdrawalAddressDetail = lazy(() => import('../withdrawals/WithdrawalAddressDetail'))
const UserList = lazy(() => import('../admin/UserList'))
const MerchantList = lazy(() => import('../admin/MerchantList'))
const MerchantSettings = lazy(() => import('../merchant/MerchantSettings'))
const AdminSettings = lazy(() => import('../admin/AdminSettings'))
const SystemLedgerList = lazy(() => import('../ledger/SystemLedgerList'))
const SystemLedgerDetail = lazy(() => import('../ledger/SystemLedgerDetail'))
const UserLedgerList = lazy(() => import('../ledger/UserLedgerList'))
const UserLedgerDetail = lazy(() => import('../ledger/UserLedgerDetail'))
const AdminInvoiceList = lazy(() => import('../admin/AdminInvoiceList'))
const AdminInvoiceDetail = lazy(() => import('../admin/AdminInvoiceDetail'))
const AdminPaymentList = lazy(() => import('../admin/AdminPaymentList'))
const AdminPaymentDetail = lazy(() => import('../admin/AdminPaymentDetail'))
const PlatformLedgerList = lazy(() => import('../ledger/PlatformLedgerList'))
const PlatformLedgerDetail = lazy(() => import('../ledger/PlatformLedgerDetail'))
const IncomeStatement = lazy(() => import('../ledger/IncomeStatement'))
const MyLedgerList = lazy(() => import('../ledger/MyLedgerList'))
const MyLedgerDetail = lazy(() => import('../ledger/MyLedgerDetail'))
const EVMFeePolicy = lazy(() => import('../admin/EVMFeePolicy'))
const NetworkFees = lazy(() => import('../admin/NetworkFees'))

export default function DashboardLayout() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const toast = useToastContext()
  // Add collapsed state and Sneat HTML attributes per vertical-menu-template (collapsed variant)
  const [collapsed, setCollapsed] = useState(false)

  // Theme & Language state synced with <html> attributes
  const THEME_STORAGE_KEY = 'ui_theme'
  const LANG_STORAGE_KEY = 'ui_lang'
  const [theme, setTheme] = useState('light') // 'light' | 'dark' | 'system'
  const [language, setLanguage] = useState({ code: 'en', dir: 'ltr', label: 'English' })
  const { user, logout, isAdmin, token, hasMenu, navigation } = useAuth()
  const [fiatBalance, setFiatBalance] = useState({ currency: 'USD', amount: '0' })

  // Ref to trigger notification refresh from Pusher callbacks
  const notificationRefreshRef = useRef(null)

  // Pending withdrawal count for badge
  const [pendingWithdrawalCount, setPendingWithdrawalCount] = useState(0)

  // Listen for withdrawal status changes (approve/reject) to refresh badge
  useEffect(() => {
    const handler = () => { if (isAdmin && token) loadPendingWithdrawalCount() }
    window.addEventListener('withdrawal-status-changed', handler)
    return () => window.removeEventListener('withdrawal-status-changed', handler)
  }, [isAdmin, token])

  // Get user identifier (try id, userId, or email)
  const userIdentifier = user?.id || user?.userId || user?.email;

  // Load payment stats for admin users
  useEffect(() => {
    if (token) {
      if (isAdmin) {
        loadPaymentStats()
        loadPendingWithdrawalCount()
      } else {
        loadUserBalance()
      }
    }
  }, [isAdmin, token])

  async function loadPendingWithdrawalCount() {
    try {
      const data = await getWithdrawals(token, { status: 'pending', page: 1, limit: 1 })
      setPendingWithdrawalCount(data.pagination?.total || 0)
    } catch (error) {
      console.error('Failed to load pending withdrawal count:', error)
    }
  }

  async function loadPaymentStats() {
    try {
      const stats = await getSystemWalletStats(token, 'USD')
      setFiatBalance({
        currency: stats?.fiat?.currency || 'USD',
        amount: stats?.fiat?.totalValueUsd || '0'
      })
    } catch (error) {
      console.error('Failed to load system wallet stats:', error)
    }
  }

  async function loadUserBalance() {
    try {
      const data = await getBalancesWithFiat(token, 'USD')
      if (data?.fiat) {
        setFiatBalance({
          currency: data.fiat.currency || 'USD',
          amount: data.fiat.amount || '0'
        })
      }
    } catch (error) {
      console.error('Failed to load user balance:', error)
    }
  }

  const refreshNotifications = useCallback(() => {
    notificationRefreshRef.current?.()
  }, [])

  // Memoize Pusher event callbacks to prevent unnecessary re-subscriptions
  const pusherCallbacks = useMemo(() => ({
      onInvoiceCreated: (data) => {
        refreshNotifications();
        playNotificationSound('info');
        toast.info({
          title: 'New Invoice',
          body: data.body || 'A new invoice has been created'
        });
      },
      onInvoiceUpdated: (data) => {
        refreshNotifications();
        playNotificationSound('info');
        toast.info({
          title: 'Invoice Updated',
          body: data.body || 'An invoice has been updated'
        });
      },
      onStatusChanged: (data) => {
        if (data.type === 'invoice_completed' || data.status === 'paid') {
          playNotificationSound('success');
          const invoiceData = {
            id: data.invoiceId,
            invoiceNumber: data.title?.replace(/^.*#/, '') || data.invoiceId,
            ...data
          };
          toast.success({
            title: 'Invoice Paid',
            body: data.body || 'Invoice has been paid successfully'
          });
          notifyPaymentReceived(invoiceData);
        } else {
          playNotificationSound('info');
          toast.info({
            title: 'Status Changed',
            body: data.body || `Invoice status changed to ${data.status}`
          });
        }
        refreshNotifications();
      },
      onPaymentReceived: (data) => {
        playNotificationSound('success');
        const invoiceData = {
          id: data.invoiceId,
          invoiceNumber: data.title?.replace(/^.*#/, '') || data.invoiceId,
          ...data
        };
        toast.success({
          title: 'Payment Received',
          body: data.body || 'Payment has been received'
        });
        notifyPaymentReceived(invoiceData);
        refreshNotifications();
      },
      onPaymentCompleted: (data) => {
        playNotificationSound('success');
        const invoiceData = {
          id: data.metadata?.referenceId,
          ...data.metadata,
          ...data
        };
        toast.success({
          title: data.title || 'Payment Completed',
          body: data.message || 'Payment has been completed successfully'
        });
        notifyPaymentReceived(invoiceData);
        refreshNotifications();
      },
      onWithdrawalCompleted: (data) => {
        playNotificationSound('success');
        toast.success({
          title: data.title || 'Withdrawal Completed',
          body: data.message || 'Withdrawal has been completed successfully'
        });
        refreshNotifications();
        loadPendingWithdrawalCount();
      }
  }), []); // Empty array - create once and never change

  // Subscribe to Pusher events for real-time updates (global for all dashboard pages)
  useUserInvoiceEvents(userIdentifier, pusherCallbacks);

  // Subscribe to system notifications for admin users (sweep_completed)
  useSystemNotifications(isAdmin, {
    onSweepCompleted: (data) => {
      playNotificationSound('success');
      toast.success({
        title: data.title || 'Sweep Completed',
        body: data.message || 'Sweep has been completed successfully'
      });
      refreshNotifications();
    }
  });

  // Helper: breakpoint check (matches navbar-expand-xl)
  const isXlUp = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(min-width: 1200px)').matches
  const openMobileMenu = () => { const html = document.documentElement; html.classList.add('layout-menu-expanded') }
  const closeMobileMenu = () => { const html = document.documentElement; html.classList.remove('layout-menu-expanded'); html.classList.remove('layout-menu-hover') }

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    html.setAttribute('data-template', 'vertical-menu-template')
    if (!html.getAttribute('data-bs-theme')) html.setAttribute('data-bs-theme', 'light')
    html.classList.add('layout-navbar-fixed', 'layout-menu-fixed', 'layout-compact')
    body.classList.add('animation-enabled')

    // Initialize audio context on first user interaction
    const initAudio = () => {
      initAudioContext();
      // Remove listeners after first interaction
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('keydown', initAudio);
    };

    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
    document.addEventListener('keydown', initAudio)
    // Ensure expanded on mount (no collapsed class by default)
    // html.classList.add('layout-menu-collapsed')
    // Rehydrate theme & language
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (savedTheme) setTheme(savedTheme)
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY)
      if (savedLang) {
        const parsed = JSON.parse(savedLang)
        if (parsed?.code) setLanguage(parsed)
      }
    } catch { }
    return () => {
      html.classList.remove('layout-navbar-fixed', 'layout-menu-fixed', 'layout-compact', 'layout-menu-collapsed', 'layout-menu-hover', 'layout-menu-expanded')
      body.classList.remove('animation-enabled')
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('keydown', initAudio);
    }
  }, [])

  // Apply theme
  useEffect(() => {
    const apply = () => {
      const html = document.documentElement
      const applied = theme === 'system'
        ? (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme
      html.setAttribute('data-bs-theme', applied)
    }
    apply()
    try { localStorage.setItem(THEME_STORAGE_KEY, theme) } catch { }

    // Update when system theme changes
    let mq
    if (theme === 'system' && window.matchMedia) {
      mq = window.matchMedia('(prefers-color-scheme: dark)')
      const listener = () => apply()
      mq.addEventListener ? mq.addEventListener('change', listener) : mq.addListener(listener)
      return () => {
        mq.removeEventListener ? mq.removeEventListener('change', listener) : mq.removeListener(listener)
      }
    }
  }, [theme])

  // Apply language sync to html + i18next
  useEffect(() => {
    const html = document.documentElement
    const localeMap = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    html.setAttribute('lang', localeMap[language.code] || language.code || 'en')
    html.setAttribute('dir', language.dir || 'ltr')
    // change i18next language if different
    if (i18n.language !== language.code) {
      i18n.changeLanguage(language.code)
    }
    try { localStorage.setItem(LANG_STORAGE_KEY, JSON.stringify(language)) } catch { }
  }, [language, i18n])

  useEffect(() => {
    const html = document.documentElement
    if (collapsed) html.classList.add('layout-menu-collapsed')
    else { html.classList.remove('layout-menu-collapsed'); html.classList.remove('layout-menu-hover') }
  }, [collapsed])

  const toggleMenu = (e) => {
    e?.preventDefault?.()
    if (isXlUp()) {
      // Desktop/tablet ≥ xl: collapse/expand sidebar
      setCollapsed(c => !c)
    } else {
      // Mobile < xl: open/close offcanvas style menu
      const html = document.documentElement
      if (html.classList.contains('layout-menu-expanded')) closeMobileMenu()
      else openMobileMenu()
    }
  }
  const onAsideEnter = () => { const html = document.documentElement; if (html.classList.contains('layout-menu-collapsed')) html.classList.add('layout-menu-hover') }
  const onAsideLeave = () => { document.documentElement.classList.remove('layout-menu-hover') }
  // Close mobile menu after clicking a leaf menu link
  const onAsideClick = (e) => {
    if (isXlUp()) return
    const link = e.target.closest && e.target.closest('a.menu-link')
    const isToggle = e.target.closest && e.target.closest('.menu-toggle')
    if (link && !isToggle) closeMobileMenu()
  }

  // Theme icon helper
  const themeIcon = theme === 'dark' ? 'bx-moon' : theme === 'system' ? 'bx-desktop' : 'bx-sun'

  // Derive user initials for fallback avatar
  const initials = (user?.fullName || user?.name || user?.email || 'U')
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0].toUpperCase())
    .join('')
    .toUpperCase()

  // i18n: supported languages list for dropdown (Thai, English, Chinese)
  const LANGS = [
    { code: 'th', dir: 'ltr', label: 'ไทย' },
    { code: 'en', dir: 'ltr', label: 'English' },
    { code: 'zh', dir: 'ltr', label: '中文' },
  ]

  return (
    <div className="layout-wrapper layout-content-navbar">
      <div className="layout-container">
        <aside id="layout-menu" className="layout-menu menu-vertical menu" onMouseEnter={onAsideEnter} onMouseLeave={onAsideLeave} onClick={onAsideClick}>
          <div className="app-brand demo">
            <a href="#" className="app-brand-link" onClick={(e) => e.preventDefault()}>
              <span className="app-brand-logo demo">
                <i className="bx bxs-wallet-alt text-primary" style={{ fontSize: '32px' }}></i>
              </span>
              <span className="app-brand-text demo menu-text fw-bold ms-2">
                <span className="text-body">BULL</span>
                <span className="text-primary">PAY</span>
              </span>
            </a>
            <a href="#" onClick={toggleMenu} className="layout-menu-toggle menu-link text-large ms-auto">
              <i className="icon-base bx bx-chevron-left"></i>
            </a>
          </div>
          <div className="menu-inner-shadow"></div>
          <ul className="menu-inner py-1">
            {isAdmin ? (
              (() => {
                // API paths match app routes directly — no mapping needed
                // Group key → icon
                const iconMap = {
                  'admin-dashboard': 'bx-bar-chart-alt-2',
                  'admin-reporting': 'bx-book',
                  'admin-user-management': 'bx-group',
                  'admin-financial': 'bx-receipt',
                  'admin-assets': 'bx-coin-stack',
                  'admin-operations': 'bx-transfer',
                  'admin-system': 'bx-cog',
                }
                // Group key → badge
                const badgeMap = {
                  'admin-financial': pendingWithdrawalCount,
                  'admin-operations': pendingWithdrawalCount,
                }

                const menus = navigation?.menus || []
                if (!menus.length) return null

                return menus.map(group => {
                  const children = group.children || []
                  const icon = iconMap[group.key] || 'bx-menu'
                  const badge = badgeMap[group.key]
                  const childPaths = children.map(c => c.path)

                  if (!children.length) {
                    return <MenuItem key={group.key} to={group.path} end icon={icon} label={group.label} />
                  }

                  return (
                    <MenuGroup
                      key={group.key}
                      base={group.path}
                      icon={icon}
                      label={group.label}
                      matchPaths={[...new Set([group.path, ...childPaths])]}
                      badge={badge}
                    >
                      {children.map(child => (
                        <SubItem key={child.key} to={child.path} end label={child.label} />
                      ))}
                    </MenuGroup>
                  )
                })
              })()
            ) : (
              <>
                {/* User menu — filtered by navigation permissions */}
                {(!navigation || hasMenu('dashboard')) && (
                  <MenuItem to="/dashboard" end icon="bx-home" label={t('nav.dashboard')} />
                )}
                {(!navigation || hasMenu('wallet')) && (
                  <MenuGroup base="/wallet" icon="bx-wallet" label={t('nav.balance', { defaultValue: 'Balance' })}>
                    <SubItem to="/wallet" end label={t('balance.account', { defaultValue: 'Account' })} />
                    <SubItem to="/wallet/withdrawals" end={true} label={t('balance.withdrawals', { defaultValue: 'Withdrawals' })} />
                  </MenuGroup>
                )}
                {(!navigation || hasMenu('invoices')) && (
                  <MenuGroup base="/invoices" icon="bx-file" label={t('nav.invoice')}>
                    <SubItem to="/invoices" end label={t('nav.history')} />
                    <SubItem to="/invoices/create" end={true} label={t('nav.create')} />
                  </MenuGroup>
                )}
                <MenuItem to="/ledger" icon="bx-book-content" label={t('nav.ledger', { defaultValue: 'Ledger' })} />
                <MenuItem to="/merchant" icon="bx-store" label={t('nav.merchant', { defaultValue: 'Merchant' })} />
                <MenuItem to="/settings" icon="bx-cog" label={t('nav.settings')} />
              </>
            )}
          </ul>
        </aside>
        <div className="menu-mobile-toggler d-xl-none rounded-1">
          <a href="#" onClick={toggleMenu} className="layout-menu-toggle menu-link text-large text-bg-secondary p-2 rounded-1">
            <i className="bx bx-menu icon-base"></i>
            <i className="bx bx-chevron-right icon-base"></i>
          </a>
        </div>
        <div className="layout-page">
          <nav className="layout-navbar container-xxl navbar-detached navbar navbar-expand-xl align-items-center bg-navbar-theme" id="layout-navbar">
            <div className="layout-menu-toggle navbar-nav align-items-xl-center me-4 me-xl-0 d-xl-none">
              <a className="nav-item nav-link px-0 me-xl-6" href="#" onClick={toggleMenu}><i className="icon-base bx bx-menu icon-md"></i></a>
            </div>
            <div className="navbar-nav-right d-flex align-items-center justify-content-end" id="navbar-collapse">
              <ul className="navbar-nav flex-row align-items-center ms-md-auto">
                {/* Balance Display */}
                <li className="nav-item me-2 me-xl-0">
                  <div className="nav-link d-flex align-items-center" style={{ cursor: 'default' }}>
                    <i className="bx bxs-wallet-alt me-2 text-primary" style={{ fontSize: '1.25rem' }}></i>
                    <span className="d-none d-md-inline" style={{ fontSize: '1.05rem' }}>
                      {formatUsd(fiatBalance.amount)}
                    </span>
                  </div>
                </li>
                {/* /Balance Display */}

                {/* Language */}
                <li className="nav-item dropdown-language dropdown me-2 me-xl-0">
                  <a className="nav-link dropdown-toggle hide-arrow" href="#" onClick={(e) => e.preventDefault()} data-bs-toggle="dropdown">
                    <i className="icon-base bx bx-globe icon-md"></i>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end">
                    {LANGS.map(lang => (
                      <li key={lang.code}>
                        <a
                          className={`dropdown-item ${i18n.language === lang.code ? 'active' : ''}`}
                          href="#"
                          onClick={(e) => { e.preventDefault(); setLanguage(lang) }}
                          data-language={lang.code}
                          data-text-direction={lang.dir}
                        >
                          <span>{lang.label}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </li>
                {/* /Language */}

                {/* Theme Switcher */}
                <li className="nav-item dropdown me-2 me-xl-0">
                  <a className="nav-link dropdown-toggle hide-arrow" id="nav-theme" href="#" onClick={(e) => e.preventDefault()} data-bs-toggle="dropdown">
                    <i className={`icon-base bx ${themeIcon} icon-md theme-icon-active`}></i>
                    <span className="d-none ms-2" id="nav-theme-text">Toggle theme</span>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="nav-theme-text">
                    {[
                      { value: 'light', label: t('theme.light'), icon: 'bx-sun' },
                      { value: 'dark', label: t('theme.dark'), icon: 'bx-moon' },
                      { value: 'system', label: t('theme.system'), icon: 'bx-desktop' },
                    ].map(opt => (
                      <li key={opt.value}>
                        <button
                          type="button"
                          className={`dropdown-item align-items-center ${theme === opt.value ? 'active' : ''}`}
                          aria-pressed={theme === opt.value}
                          onClick={() => setTheme(opt.value)}
                        >
                          <span><i className={`icon-base bx ${opt.icon} icon-md me-3`} data-icon={opt.label.toLowerCase()}></i>{opt.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
                {/* /Theme Switcher */}

                {/* Notifications */}
                <NotificationDropdown refreshRef={notificationRefreshRef} />
                {/* /Notifications */}

                {/* User */}
                <li className="nav-item navbar-dropdown dropdown-user dropdown">
                  <a className="nav-link dropdown-toggle hide-arrow" href="#" onClick={(e) => e.preventDefault()} data-bs-toggle="dropdown">
                    <div className="avatar avatar-online">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt="avatar" className="rounded-circle" />
                      ) : (
                        <span className="avatar-initial rounded-circle bg-label-primary">{initials}</span>
                      )}
                    </div>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end">
                    <li>
                      <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>
                        <div className="d-flex">
                          <div className="flex-shrink-0 me-3">
                            <div className="avatar avatar-online">
                              {user?.avatarUrl ? (
                                <img src={user.avatarUrl} alt="avatar" className="w-px-40 h-auto rounded-circle" />
                              ) : (
                                <span className="avatar-initial rounded-circle bg-label-primary">{initials}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <span className="fw-medium d-block">{user?.fullName || user?.name || user?.email || 'User'}</span>
                            <small className="text-muted">
                              {isAdmin ? (
                                <span className="badge bg-label-danger badge-sm">Admin</span>
                              ) : (
                                <span>{user?.role || 'User'}</span>
                              )}
                            </small>
                          </div>
                        </div>
                      </a>
                    </li>
                    <li><div className="dropdown-divider"></div></li>
                    {!isAdmin && (
                      <li>
                        <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); navigate('/settings') }}>
                          <i className="icon-base bx bx-cog icon-md me-3"></i><span>{t('nav.settings')}</span>
                        </a>
                      </li>
                    )}
                    <li><div className="dropdown-divider"></div></li>
                    <li>
                      <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); logout(); navigate('/', { replace: true }) }}>
                        <i className="icon-base bx bx-log-out icon-md me-3"></i><span>{t('user.logout')}</span>
                      </a>
                    </li>
                  </ul>
                </li>
                {/* /User */}
              </ul>
            </div>
          </nav>
          <div className="content-wrapper">
            <Suspense fallback={<div className="d-flex justify-content-center align-items-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
            <div>
              <Routes>
                {isAdmin ? (
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
                ) : (
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
                )}
              </Routes>
            </div>
            </Suspense>
            <footer className="content-footer footer bg-footer-theme">
              <div className="container-xxl d-flex flex-wrap justify-content-between py-2 flex-md-row flex-column">
                <div className="mb-2 mb-md-0">© {new Date().getFullYear()} Bull Pay</div>
              </div>
            </footer>
            <div className="content-backdrop fade"></div>
          </div>
        </div>
      </div>
      <div className="layout-overlay layout-menu-toggle" onClick={toggleMenu} role="button" aria-label="Close menu"></div>
      <div className="drag-target"></div>

      {/* Notification Badge Styles */}
      <style>{`
        .badge-dot-notifications {
          position: absolute;
          top: 2px;
          right: 0;
          width: 8px;
          height: 8px;
          background-color: #dc3545;
          border: 2px solid var(--bs-body-bg, #fff);
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(220, 38, 38, 0.3);
          pointer-events: none;
        }
        .dropdown-notifications {
          position: relative;
        }
        .dropdown-notifications .dropdown-menu {
          width: 380px;
          max-height: 450px;
        }
        .dropdown-notifications-list {
          max-height: 300px;
          overflow-y: auto;
          min-height: 150px;
        }
        .dropdown-notifications-list .list-group-flush {
          margin: 0;
        }
        .dropdown-notifications-item {
          padding: 0.75rem 1.5rem;
          cursor: pointer;
          transition: background-color 0.2s;
          border-left: 3px solid transparent;
        }
        .dropdown-notifications-item.unread {
          background-color: rgba(139, 92, 246, 0.05);
          border-left-color: rgba(139, 92, 246, 0.5);
          font-weight: 500;
        }
        .dropdown-notifications-item:hover {
          background-color: rgba(0,0,0,0.02);
        }
        .dropdown-notifications-item.unread:hover {
          background-color: rgba(139, 92, 246, 0.08);
        }
        [data-bs-theme="dark"] .dropdown-notifications-item:hover {
          background-color: rgba(255,255,255,0.05);
        }
        [data-bs-theme="dark"] .dropdown-notifications-item.unread {
          background-color: rgba(139, 92, 246, 0.1);
        }
        .dropdown-notifications-actions {
          display: flex;
          gap: 0.5rem;
        }
        .dropdown-notifications-actions a {
          color: #6c757d;
          transition: color 0.2s;
        }
        .dropdown-notifications-actions a:hover {
          color: #8b5cf6;
        }
        .badge-sm {
          font-size: 0.625rem;
          padding: 0.15rem 0.35rem;
        }
      `}</style>
    </div>
  )
}
