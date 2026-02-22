import { Routes, useNavigate } from 'react-router-dom'
import { Suspense, useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'
import { initAudioContext } from '../../utils/notification'
import { formatUsd } from '../../utils/format'
// Layout components (eager — always visible)
import { MenuItem, SubItem, MenuGroup } from './SidebarMenu'
import NotificationDropdown from './NotificationDropdown'
import useDashboardData from '../../hooks/useDashboardData'
import { renderAdminRoutes, renderUserRoutes } from '../../routes/dashboardRoutes.jsx'
import './notification-badge.css'

export default function DashboardLayout() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user, logout, isAdmin, hasMenu, navigation } = useAuth()
  const { fiatBalance, pendingWithdrawalCount, notificationRefreshRef } = useDashboardData()

  // Add collapsed state and Sneat HTML attributes per vertical-menu-template (collapsed variant)
  const [collapsed, setCollapsed] = useState(false)

  // Theme & Language state synced with <html> attributes
  const THEME_STORAGE_KEY = 'ui_theme'
  const LANG_STORAGE_KEY = 'ui_lang'
  const [theme, setTheme] = useState('light') // 'light' | 'dark' | 'system'
  const [language, setLanguage] = useState({ code: 'en', dir: 'ltr', label: 'English' })

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
      document.removeEventListener('click', initAudio);
      document.removeEventListener('touchstart', initAudio);
      document.removeEventListener('keydown', initAudio);
    };

    document.addEventListener('click', initAudio);
    document.addEventListener('touchstart', initAudio);
    document.addEventListener('keydown', initAudio)
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
      setCollapsed(c => !c)
    } else {
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
                const iconMap = {
                  'admin-dashboard': 'bx-bar-chart-alt-2',
                  'admin-reporting': 'bx-book',
                  'admin-user-management': 'bx-group',
                  'admin-financial': 'bx-receipt',
                  'admin-assets': 'bx-coin-stack',
                  'admin-operations': 'bx-transfer',
                  'admin-system': 'bx-cog',
                }
                const badgeMap = {
                  'admin-financial': pendingWithdrawalCount,
                  'admin-operations': pendingWithdrawalCount,
                }
                // Badge for individual submenu items (matched by path)
                const childBadgeMap = {
                  '/admin/withdrawals': pendingWithdrawalCount,
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
                        <SubItem key={child.key} to={child.path} end label={child.label} badge={childBadgeMap[child.path]} />
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
                {isAdmin ? renderAdminRoutes() : renderUserRoutes()}
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
    </div>
  )
}
