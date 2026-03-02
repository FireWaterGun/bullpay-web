'use client'

import { useAuth } from '@/app/providers'
import type { NavigationItem, NavigationSection } from '@/app/providers'
import { useRouter } from 'next/navigation'
import React, { Suspense, useEffect, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { THEME_STORAGE_KEY, LANG_STORAGE_KEY } from '@/lib/constants'
import { initAudioContext } from '@/lib/utils/notification'
import { SectionHeader, MenuItem, SubItem, MenuGroup } from '@/components/dashboard/SidebarMenu'
import NavbarContent from '@/components/dashboard/NavbarContent'
import useDashboardData from '@/hooks/useDashboardData'
import '@/components/dashboard/notification-badge.css'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation()
  const { user, token, navigation, isAdmin, isReady, hasMenu } = useAuth()
  const router = useRouter()
  const { fiatBalance, pendingWithdrawalCount, notificationRefreshRef } = useDashboardData()

  const [collapsed, setCollapsed] = useState(false)
  const [theme, setTheme] = useState('light')
  const [language, setLanguage] = useState({ code: 'en', dir: 'ltr', label: 'English' })

  const isXlUp = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(min-width: 1200px)').matches
  const openMobileMenu = () => { document.documentElement.classList.add('layout-menu-expanded') }
  const closeMobileMenu = () => { document.documentElement.classList.remove('layout-menu-expanded'); document.documentElement.classList.remove('layout-menu-hover') }

  // Redirect if not authenticated
  useEffect(() => {
    if (isReady && !token) {
      router.replace('/login')
    }
  }, [isReady, token, router])

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    html.setAttribute('data-template', 'vertical-menu-template')
    if (!html.getAttribute('data-bs-theme')) html.setAttribute('data-bs-theme', 'light')
    html.classList.add('layout-navbar-fixed', 'layout-menu-fixed', 'layout-compact')
    body.classList.add('animation-enabled')

    const initAudio = () => {
      initAudioContext()
      document.removeEventListener('click', initAudio)
      document.removeEventListener('touchstart', initAudio)
      document.removeEventListener('keydown', initAudio)
    }

    document.addEventListener('click', initAudio)
    document.addEventListener('touchstart', initAudio, { passive: true })
    document.addEventListener('keydown', initAudio)

    // Clear stale TemplateCustomizer localStorage (main.js reads these and can override React theme)
    try {
      const tplName = 'vertical-menu-template'
      localStorage.removeItem(`templateCustomizer-${tplName}--Theme`)
      localStorage.removeItem(`templateCustomizer-${tplName}--Skin`)
      localStorage.removeItem(`templateCustomizer-${tplName}--Color`)
      localStorage.removeItem(`templateCustomizer-${tplName}--LayoutCollapsed`)
      localStorage.removeItem(`templateCustomizer-${tplName}--Rtl`)
      localStorage.removeItem(`templateCustomizer-${tplName}--Lang`)
    } catch { }

    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY)
      if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme)
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY)
      if (savedLang) {
        const parsed = JSON.parse(savedLang)
        if (parsed?.code) setLanguage(parsed)
      }
    } catch { }

    return () => {
      html.classList.remove('layout-navbar-fixed', 'layout-menu-fixed', 'layout-compact', 'layout-menu-collapsed', 'layout-menu-hover', 'layout-menu-expanded')
      body.classList.remove('animation-enabled')
      document.removeEventListener('click', initAudio)
      document.removeEventListener('touchstart', initAudio)
      document.removeEventListener('keydown', initAudio)
    }
  }, [])

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-bs-theme', theme)
    try { localStorage.setItem(THEME_STORAGE_KEY, theme) } catch { }
  }, [theme])

  // Apply language
  useEffect(() => {
    const html = document.documentElement
    const localeMap: Record<string, string> = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' }
    html.setAttribute('lang', localeMap[language.code] || language.code || 'en')
    html.setAttribute('dir', language.dir || 'ltr')
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

  const toggleMenu = (e?: React.MouseEvent) => {
    e?.preventDefault?.()
    if (isXlUp()) {
      setCollapsed(c => !c)
    } else {
      const html = document.documentElement
      if (html.classList.contains('layout-menu-expanded')) closeMobileMenu()
      else openMobileMenu()
    }
  }

  const onAsideEnter = () => { if (document.documentElement.classList.contains('layout-menu-collapsed')) document.documentElement.classList.add('layout-menu-hover') }
  const onAsideLeave = () => { document.documentElement.classList.remove('layout-menu-hover') }
  const onAsideClick = (e: React.MouseEvent) => {
    if (isXlUp()) return
    const target = e.target as HTMLElement
    const link = target.closest?.('a.menu-link')
    const isToggle = target.closest?.('.menu-toggle')
    if (link && !isToggle) closeMobileMenu()
  }

  if (!isReady || !token) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  // Map API navigation keys → i18n translation keys
  const navLabel = (key: string, fallback: string) => {
    const keyMap: Record<string, string> = {
      // User menu
      'dashboard': 'nav.dashboard',
      'wallet': 'nav.wallet',
      'wallet-overview': 'nav.balance',
      'withdrawal': 'nav.withdrawals',
      'invoices': 'nav.invoice',
      'ledgers': 'nav.ledgers',
      'settings': 'nav.settings',
      '2fa': 'nav.twoFactor',
      'merchant': 'nav.merchant',
      // Admin menu
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
      'admin-user-management': 'nav.userMerchant',
      'admin-users': 'nav.users',
      'admin-merchants': 'nav.merchants',
      'admin-roles': 'nav.rolesPermissions',
      'admin-assets': 'nav.cryptoManagement',
      'admin-coins': 'nav.coins',
      'admin-networks': 'nav.networks',
      'admin-coin-networks': 'nav.coinNetworks',
      'admin-system': 'nav.settings',
      'admin-audit-logs': 'nav.auditLogs',
      'admin-merchant-webhook-logs': 'nav.webhookLogs',
    }
    return keyMap[key] ? t(keyMap[key], { defaultValue: fallback }) : fallback
  }

  const sectionLabel = (section: string) => {
    const sectionMap: Record<string, string> = {
      'Overview': 'nav.sectionOverview',
      'Financial': 'nav.sectionFinancial',
      'Account': 'nav.sectionAccount',
      'Reports': 'nav.sectionReports',
      'Operations': 'nav.sectionOperations',
      'Management': 'nav.sectionManagement',
      'System': 'nav.sectionSystem',
    }
    return sectionMap[section] ? t(sectionMap[section], { defaultValue: section }) : section
  }

  const renderMenus = () => {
    const sections = navigation?.menus || []
    if (!sections.length) return null

    const badgeMap: Record<string, number | undefined> = {
      'admin-operations': pendingWithdrawalCount,
    }
    const childBadgeMap: Record<string, number | undefined> = {
      '/admin/withdrawals': pendingWithdrawalCount,
    }

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
              return <MenuItem key={item.key} to={item.path} end icon={icon} label={navLabel(item.key, item.label)} />
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
                {children.map((child: NavigationItem) => (
                  <SubItem key={child.key} to={child.path} end label={navLabel(child.key, child.label)} badge={childBadgeMap[child.path]} />
                ))}
              </MenuGroup>
            )
          })}
        </React.Fragment>
      )
    })
  }

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
            {renderMenus()}
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
            <NavbarContent
              fiatBalance={fiatBalance}
              notificationRefreshRef={notificationRefreshRef}
              theme={theme}
              setTheme={setTheme}
              language={language}
              setLanguage={setLanguage}
            />
          </nav>
          <div className="content-wrapper">
            <Suspense fallback={<div className="d-flex justify-content-center align-items-center py-5"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div>}>
              {children}
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
    </div>
  )
}
