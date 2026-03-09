'use client'

import { useAuth, usePusher } from '@/app/providers'
import type { NavigationItem, NavigationSection } from '@/app/providers'
import { useRouter } from 'next/navigation'
import React, { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { THEME_STORAGE_KEY, LANG_STORAGE_KEY, SIDEBAR_COLLAPSED_KEY, API_BASE_URL } from '@/lib/constants'
import { initAudioContext } from '@/lib/utils/notification'
import { SectionHeader, MenuItem, SubItem, MenuGroup } from '@/components/dashboard/SidebarMenu'
import NavbarContent from '@/components/dashboard/NavbarContent'
import MaintenanceBanner from '@/components/admin/MaintenanceBanner'
import { checkMaintenanceBlocked } from '@/lib/api/system'
import useDashboardData from '@/hooks/useDashboardData'
import { Spinner } from '../../components/ui'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { user, token, navigation, isAdmin, isReady, hasMenu } = useAuth()
  const router = useRouter()
  const { fiatBalance, pendingWithdrawalCount, notificationRefreshRef } = useDashboardData()
  const { subscribe, unsubscribe, isConnected } = usePusher() || {}

  const maintenanceChannelRef = useRef<any>(null)

  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1'
    } catch {
      return false
    }
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState({ code: 'en', dir: 'ltr', label: 'English' })

  const isXlUp = () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1200px)').matches

  // ── Redirect if not authenticated ──
  useEffect(() => {
    if (isReady && !token) router.replace('/login')
  }, [isReady, token, router])

  // ── Real-time maintenance redirect ──
  useEffect(() => {
    if (!subscribe || !isConnected || isAdmin || !isReady) return

    const channel = subscribe('system-maintenance') as any
    maintenanceChannelRef.current = channel
    if (channel) {
      channel.bind('maintenance-status-changed', (data: any) => {
        if (data.maintenance) {
          checkMaintenanceBlocked(token || undefined).then((blocked) => {
            if (!blocked) return
            try {
              sessionStorage.setItem(
                'maintenance_info',
                JSON.stringify({ message: data.message, estimatedEnd: data.estimatedEnd })
              )
            } catch {}
            window.location.href = '/maintenance'
          })
        }
      })
    }
    return () => {
      if (maintenanceChannelRef.current) {
        maintenanceChannelRef.current.unbind_all()
        unsubscribe?.('system-maintenance')
        maintenanceChannelRef.current = null
      }
    }
  }, [subscribe, unsubscribe, isConnected, isAdmin, isReady, token])

  // ── Audio init ──
  useEffect(() => {
    const initAudio = () => {
      initAudioContext()
      document.removeEventListener('click', initAudio)
      document.removeEventListener('touchstart', initAudio)
      document.removeEventListener('keydown', initAudio)
    }
    document.addEventListener('click', initAudio)
    document.addEventListener('touchstart', initAudio, { passive: true })
    document.addEventListener('keydown', initAudio)
    return () => {
      document.removeEventListener('click', initAudio)
      document.removeEventListener('touchstart', initAudio)
      document.removeEventListener('keydown', initAudio)
    }
  }, [])

  // ── Persist & apply theme ──
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (savedTheme === 'light' || savedTheme === 'dark') {
        queueMicrotask(() => setTheme(savedTheme))
      }
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY)
      if (savedLang) {
        const parsed = JSON.parse(savedLang)
        if (parsed?.code) {
          queueMicrotask(() => setLanguage(parsed))
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    const el = document.documentElement
    el.classList.add('theme-switching')
    el.setAttribute('data-theme', theme)
    // Re-enable transitions after one animation frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.classList.remove('theme-switching')
      })
    })
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme)
    } catch {}
  }, [theme])

  // ── Persist sidebar collapsed state ──
  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, collapsed ? '1' : '0')
    } catch {}
  }, [collapsed])

  useEffect(() => {
    const html = document.documentElement
    const localeMap: Record<string, string> = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    html.setAttribute('lang', localeMap[language.code] || language.code || 'en')
    html.setAttribute('dir', language.dir || 'ltr')
    if (i18n.language !== language.code) i18n.changeLanguage(language.code)
    try {
      localStorage.setItem(LANG_STORAGE_KEY, JSON.stringify(language))
    } catch {}
  }, [language, i18n])

  // ── Close mobile sidebar immediately on link click ──
  const closeMobileMenu = useCallback(() => {
    if (!isXlUp()) setMobileOpen(false)
  }, [])

  // ── Toggle sidebar ──
  const sidebarRef = useRef<HTMLElement>(null)
  const toggleMenu = (e?: React.MouseEvent) => {
    e?.preventDefault?.()
    if (isXlUp()) {
      setCollapsed((c) => {
        if (!c && sidebarRef.current) {
          // Suppress hover-expand while mouse is still over the sidebar
          const el = sidebarRef.current
          el.classList.add('bp-collapsing')
          setTimeout(() => el.classList.remove('bp-collapsing'), 400)
        }
        return !c
      })
    } else {
      setMobileOpen((v) => !v)
    }
  }

  // ── Loading state ──
  if (!isReady || !token) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="lg" className="text-primary-600" />
      </div>
    )
  }

  // ── i18n label maps ──
  const navLabel = (key: string, fallback: string) => {
    const keyMap: Record<string, string> = {
      dashboard: 'nav.dashboard',
      reports: 'nav.reports',
      wallet: 'nav.wallet',
      'wallet-overview': 'nav.balance',
      withdrawal: 'nav.withdrawals',
      invoices: 'nav.invoice',
      activity: 'nav.activity',
      settings: 'nav.settings',
      '2fa': 'nav.twoFactor',
      integration: 'nav.integration',
      'merchant-overview': 'nav.apiCredentials',
      'webhook-logs': 'nav.webhookLogs',
      'api-docs': 'nav.apiDocs',
      'admin-dashboard': 'nav.revenueDashboard',
      'income-statement': 'nav.incomeStatement',
      'admin-platform-ledger': 'nav.revenueExpense',
      'admin-system-ledger': 'nav.systemLedger',
      'admin-user-ledger': 'nav.userLedger',
      'admin-system-wallets': 'nav.systemWallets',
      'admin-user-balances': 'nav.userBalances',
      'admin-withdrawal-addresses': 'nav.withdrawalWallets',
      'admin-temp-wallets': 'nav.tempWallets',
      'admin-ops-withdrawals': 'nav.withdrawals',
      'admin-ops-invoices': 'nav.invoice',
      'admin-ops-payments': 'nav.payments',
      'admin-sweeps': 'nav.sweeps',
      'admin-gas-topups': 'nav.gasTopups',
      'admin-user-management': 'nav.users',
      'admin-users': 'nav.users',
      'admin-merchants': 'nav.merchants',
      'admin-roles': 'nav.rolesPermissions',
      'admin-assets': 'nav.cryptoManagement',
      'admin-coins': 'nav.coins',
      'admin-networks': 'nav.networks',
      'admin-coin-networks': 'nav.coinNetworks',
      'admin-system': 'nav.settings',
      'admin-withdrawal-settings': 'nav.withdrawalSettings',
      'admin-gas-settings': 'nav.gasSettings',
      'admin-rbf-settings': 'nav.rbfSettings',
      'admin-maintenance': 'nav.maintenance',
      'admin-audit-logs': 'nav.auditLogs',
      'admin-merchant-webhook-logs': 'nav.webhookLogs',
      'admin-account': 'nav.myAccount',
    }
    return keyMap[key] ? t(keyMap[key], { defaultValue: fallback }) : fallback
  }

  const sectionLabel = (section: string) => {
    const sectionMap: Record<string, string> = {
      Overview: 'nav.sectionOverview',
      Payments: 'nav.sectionPayments',
      Account: 'nav.sectionAccount',
      Reports: 'nav.sectionReports',
      Operations: 'nav.sectionOperations',
      Management: 'nav.sectionManagement',
      System: 'nav.sectionSystem',
    }
    return sectionMap[section] ? t(sectionMap[section], { defaultValue: section }) : section
  }

  // ── Badge maps ──
  const badgeMap: Record<string, number | undefined> = {
    'admin-operations': pendingWithdrawalCount,
  }
  const childBadgeMap: Record<string, number | undefined> = {
    '/admin/withdrawals': pendingWithdrawalCount,
  }

  const renderMenus = () => {
    const sections = navigation?.menus || []
    if (!sections.length) return null

    return sections.map((section: NavigationSection) => {
      const items = section.items || []
      if (!items.length) return null

      return (
        <React.Fragment key={section.section}>
          <SectionHeader label={sectionLabel(section.section)} />
          {items.map((item: NavigationItem) => {
            const children = item.children || []
            const icon = item.icon || 'bx-menu'
            const badge = badgeMap[item.key]
            const childPaths = children.map((c: NavigationItem) => c.path)

            if (!children.length) {
              const itemBadge = badge || childBadgeMap[item.path]
              return (
                <MenuItem
                  key={item.key}
                  to={item.path}
                  icon={icon}
                  label={navLabel(item.key, item.label)}
                  badge={itemBadge}
                />
              )
            }

            return (
              <MenuGroup
                key={item.key}
                base={item.path}
                icon={icon}
                label={navLabel(item.key, item.label)}
                matchPaths={[...new Set([item.path, ...childPaths])]}
                badge={badge}
              >
                {children.map((child: NavigationItem) => {
                  const childTo = child.external ? `${API_BASE_URL}${child.path}` : child.path
                  return (
                    <SubItem
                      key={child.key}
                      to={childTo}
                      end={child.path === item.path}
                      label={navLabel(child.key, child.label)}
                      badge={childBadgeMap[child.path]}
                      external={child.external}
                    />
                  )
                })}
              </MenuGroup>
            )
          })}
        </React.Fragment>
      )
    })
  }

  return (
    <>
      {/* ── Sidebar ── */}
      <aside ref={sidebarRef} className={`bp-sidebar ${collapsed ? 'bp-collapsed' : ''} ${mobileOpen ? 'bp-mobile-open' : ''}`}>
        {/* Brand */}
        <div className="relative flex items-center h-[64px] px-[calc(0.9375rem*2.1333)] shrink-0">
          <a href="/dashboard" className="flex items-center gap-2.5 no-underline">
            <span className="flex items-center justify-center w-[25px] h-[34px] text-primary-600 shrink-0">
              <i className="bx bxs-wallet-alt text-[22px]"></i>
            </span>
            <span className="bp-brand-text font-bold text-[1.25rem] tracking-tight whitespace-nowrap ml-0.5">
              <span className="text-surface-800">BULL</span>
              <span className="text-primary-600">PAY</span>
            </span>
          </a>
          {/* Collapse toggle — absolute positioned at sidebar edge */}
          <button
            type="button"
            onClick={toggleMenu}
            className="bp-collapse-btn absolute z-[3] hidden xl:flex items-center justify-center w-[30px] h-[30px] rounded-full bg-primary-600 border-[4px] cursor-pointer shadow-none hover:shadow-[0_4px_16px_rgba(99,91,255,0.3)] hover:scale-110 transition-all duration-200 left-[15.2rem]"
          >
            <i
              className={`bx ${collapsed ? 'bx-chevron-right' : 'bx-chevron-left'} text-white text-[0.95rem] leading-none`}
            ></i>
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="bp-collapse-btn ml-auto flex items-center justify-center w-7 h-7 rounded-md text-surface-400 hover:bg-surface-100 transition-colors cursor-pointer xl:hidden"
          >
            <i className="bx bx-x text-xl"></i>
          </button>
        </div>

        {/* Menu */}
        <nav
          className="bp-sidebar-scroll"
          onClick={(e) => {
            const anchor = (e.target as HTMLElement).closest('a[href]:not([href="#"])')
            if (anchor) closeMobileMenu()
          }}
        >
          <ul className="list-none p-0 m-0 py-2">{renderMenus()}</ul>
        </nav>

        {/* User info at bottom */}
        <div className="bp-sidebar-user">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-primary-100 text-primary-600 text-sm font-semibold shrink-0">
              {String(user?.fullName || user?.name || user?.email || 'U')
                .split(/\s+|@/)
                .filter(Boolean)
                .slice(0, 2)
                .map((s: string) => s[0].toUpperCase())
                .join('')}
            </span>
            <div className="bp-sidebar-user-info min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-surface-800 truncate mb-0">
                {user?.fullName || user?.name || user?.email || '-'}
              </p>
              <p className="text-[11px] text-surface-400 truncate mb-0">{user?.email || ''}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Mobile backdrop ── */}
      <div
        className={`bp-backdrop ${mobileOpen ? 'bp-backdrop-visible' : ''}`}
        onClick={() => setMobileOpen(false)}
        role="button"
        aria-label="Close menu"
      />

      {/* ── Main area ── */}
      <div className={`bp-main ${collapsed ? 'bp-main-collapsed' : ''}`}>
        {/* Navbar */}
        <nav className="bp-navbar">
          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={toggleMenu}
            className="flex items-center justify-center w-9 h-9 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-white/8 transition-colors cursor-pointer xl:hidden"
          >
            <i className="bx bx-menu text-xl"></i>
          </button>

          {isAdmin && <MaintenanceBanner />}

          <NavbarContent
            fiatBalance={fiatBalance}
            notificationRefreshRef={notificationRefreshRef}
            theme={theme}
            setTheme={setTheme}
            language={language}
            setLanguage={setLanguage}
          />
        </nav>

        {/* Content */}
        <div className="flex-1 px-4 sm:px-6 pt-4 pb-4">{children}</div>

        {/* Footer */}
        <footer className="px-6 py-3 text-center text-sm text-surface-400">
          © {new Date().getFullYear()} Bull Pay
        </footer>
      </div>
    </>
  )
}
