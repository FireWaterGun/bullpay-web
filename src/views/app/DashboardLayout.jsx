import { Routes, Route, NavLink, Navigate, useNavigate, useMatch, useResolvedPath } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTranslation } from 'react-i18next'

// Remove inline page components and import split components
import DashboardHome from './DashboardHome'
import Settings from './Settings'
import WalletCreate from '../wallets/WalletCreate'
import WalletList from '../wallets/WalletList'
import WalletEdit from '../wallets/WalletEdit'
import InvoiceList from '../invoices/InvoiceList'
import InvoiceCreate from '../invoices/InvoiceCreate'
import InvoiceDetail from '../invoices/InvoiceDetail'
import InvoicePayment from '../invoices/InvoicePayment'
import Balance from '../balance/Balance'
import BalanceAccount from '../balance/BalanceAccount'
import BalanceWithdrawals from '../balance/BalanceWithdrawals'
import WithdrawRequest from '../balance/WithdrawRequest'

function MenuItem({ to, icon, label, end }) {
  const resolved = useResolvedPath(to)
  const match = useMatch({ path: resolved.pathname, end: !!end })
  const isActive = !!match
  return (
    <li className={`menu-item ${isActive ? 'active' : ''}`}>
      <NavLink to={to} end={end} className="menu-link" onClick={(e)=>{ /* close handled at aside */ }}>
        <i className={`menu-icon bx ${icon}`}></i>
        <div>{label}</div>
      </NavLink>
    </li>
  )
}

function SubItem({ to, label, end }) {
  const resolved = useResolvedPath(to)
  const match = useMatch({ path: resolved.pathname, end: !!end })
  const isActive = !!match
  return (
    <li className={`menu-item ${isActive ? 'active' : ''}`}>
      <NavLink to={to} end={end} className="menu-link">
        <div>{label}</div>
      </NavLink>
    </li>
  )
}

function MenuGroup({ base, icon, label, children }) {
  const resolved = useResolvedPath(base)
  const match = useMatch({ path: `${resolved.pathname}/*`, end: false })
  const [open, setOpen] = useState(!!match)
  const isActive = !!match
  const toggle = (e) => { e.preventDefault(); setOpen((v)=>!v) }
  const isCollapsed = typeof document !== 'undefined' && document.documentElement.classList.contains('layout-menu-collapsed')
  const handleEnter = () => { if (isCollapsed) setOpen(true) }
  const handleLeave = () => { if (isCollapsed) setOpen(false) }
  // Keep group in sync with route when not collapsed
  useEffect(() => { if (!isCollapsed) setOpen(!!match) }, [match])

  // Smooth collapse/expand (match Sneat .3s ease-in-out)
  const subRef = useRef(null)
  const liRef = useRef(null)
  const prevOpen = useRef(open)

  useEffect(() => {
    const sub = subRef.current
    const li = liRef.current
    if (!sub) return

    // Ensure transition style
    sub.style.overflow = 'hidden'
    sub.style.transition = 'max-height 0.3s ease-in-out'

    const wasOpen = prevOpen.current
    prevOpen.current = open

    if (open) {
      const target = sub.scrollHeight + 'px'
      requestAnimationFrame(() => { sub.style.maxHeight = target })
    } else {
      if (wasOpen && li) li.classList.add('menu-item-closing')
      requestAnimationFrame(() => { sub.style.maxHeight = '0px' })
    }
  }, [open])

  useEffect(() => {
    // Remove the closing class after transition ends
    const sub = subRef.current
    const li = liRef.current
    if (!sub || !li) return
    const onEnd = (e) => { if (e.propertyName === 'max-height') li.classList.remove('menu-item-closing') }
    sub.addEventListener('transitionend', onEnd)
    return () => sub.removeEventListener('transitionend', onEnd)
  }, [])

  useEffect(() => {
    // When window resizes or content changes, adjust maxHeight if open
    const el = subRef.current
    if (!el) return
    const handle = () => { if (open) el.style.maxHeight = el.scrollHeight + 'px' }
    window.addEventListener('resize', handle)
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(handle) : null
    if (ro) ro.observe(el)
    return () => { window.removeEventListener('resize', handle); if (ro) ro.disconnect() }
  }, [open])

  return (
    <li ref={liRef} className={`menu-item ${open ? 'open' : ''} ${isActive ? 'active' : ''}`} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <a href="#" className="menu-link menu-toggle" onClick={(e)=>{ e.preventDefault(); toggle(e) }} aria-expanded={open} aria-controls={`${label}-submenu`}>
        <i className={`menu-icon bx ${icon}`}></i>
        <div>{label}</div>
      </a>
      <ul id={`${label}-submenu`} className="menu-sub" ref={subRef} style={{ maxHeight: open ? undefined : 0, overflow: 'hidden' }}>
        {children}
      </ul>
    </li>
  )
}

export default function DashboardLayout() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  // Add collapsed state and Sneat HTML attributes per vertical-menu-template (collapsed variant)
  const [collapsed, setCollapsed] = useState(false)

  // Theme & Language state synced with <html> attributes
  const THEME_STORAGE_KEY = 'ui_theme'
  const LANG_STORAGE_KEY = 'ui_lang'
  const [theme, setTheme] = useState('dark') // 'light' | 'dark' | 'system'
  const [language, setLanguage] = useState({ code: 'en', dir: 'ltr', label: 'English' })
  const { user, logout } = useAuth()

  // Helper: breakpoint check (matches navbar-expand-xl)
  const isXlUp = () => typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(min-width: 1200px)').matches
  const openMobileMenu = () => { const html = document.documentElement; html.classList.add('layout-menu-expanded') }
  const closeMobileMenu = () => { const html = document.documentElement; html.classList.remove('layout-menu-expanded'); html.classList.remove('layout-menu-hover') }

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    html.setAttribute('data-template', 'vertical-menu-template')
  if (!html.getAttribute('data-bs-theme')) html.setAttribute('data-bs-theme', 'dark')
    html.classList.add('layout-navbar-fixed', 'layout-menu-fixed', 'layout-compact')
    body.classList.add('animation-enabled')
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
    } catch {}
    return () => {
      html.classList.remove('layout-navbar-fixed', 'layout-menu-fixed', 'layout-compact', 'layout-menu-collapsed', 'layout-menu-hover', 'layout-menu-expanded')
      body.classList.remove('animation-enabled')
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
    try { localStorage.setItem(THEME_STORAGE_KEY, theme) } catch {}

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
    html.setAttribute('lang', language.code || 'en')
    html.setAttribute('dir', language.dir || 'ltr')
    // change i18next language if different
    if (i18n.language !== language.code) {
      i18n.changeLanguage(language.code)
    }
    try { localStorage.setItem(LANG_STORAGE_KEY, JSON.stringify(language)) } catch {}
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
  const initials = (user?.name || user?.email || 'U')
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0])
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
            <a href="#" className="app-brand-link" onClick={(e)=>e.preventDefault()}>
              <span className="app-brand-logo demo">
                <span className="text-primary">
                  <svg
                    width="25"
                    viewBox="0 0 25 42"
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    xmlnsXlink="http://www.w3.org/1999/xlink">
                    <defs>
                      <path
                        d="M13.7918663,0.358365126 L3.39788168,7.44174259 C0.566865006,9.69408886 -0.379795268,12.4788597 0.557900856,15.7960551 C0.68998853,16.2305145 1.09562888,17.7872135 3.12357076,19.2293357 C3.8146334,19.7207684 5.32369333,20.3834223 7.65075054,21.2172976 L7.59773219,21.2525164 L2.63468769,24.5493413 C0.445452254,26.3002124 0.0884951797,28.5083815 1.56381646,31.1738486 C2.83770406,32.8170431 5.20850219,33.2640127 7.09180128,32.5391577 C8.347334,32.0559211 11.4559176,30.0011079 16.4175519,26.3747182 C18.0338572,24.4997857 18.6973423,22.4544883 18.4080071,20.2388261 C17.963753,17.5346866 16.1776345,15.5799961 13.0496516,14.3747546 L10.9194936,13.4715819 L18.6192054,7.984237 L13.7918663,0.358365126 Z"
                        id="path-1"></path>
                      <path
                        d="M5.47320593,6.00457225 C4.05321814,8.216144 4.36334763,10.0722806 6.40359441,11.5729822 C8.61520715,12.571656 10.0999176,13.2171421 10.8577257,13.5094407 L15.5088241,14.433041 L18.6192054,7.984237 C15.5364148,3.11535317 13.9273018,0.573395879 13.7918663,0.358365126 C13.5790555,0.511491653 10.8061687,2.3935607 5.47320593,6.00457225 Z"
                        id="path-3"></path>
                      <path
                        d="M7.50063644,21.2294429 L12.3234468,23.3159332 C14.1688022,24.7579751 14.397098,26.4880487 13.008334,28.506154 C11.6195701,30.5242593 10.3099883,31.790241 9.07958868,32.3040991 C5.78142938,33.4346997 4.13234973,34 4.13234973,34 C4.13234973,34 2.75489982,33.0538207 2.37032616e-14,31.1614621 C-0.55822714,27.8186216 -0.55822714,26.0572515 -4.05231404e-15,25.8773518 C0.83734071,25.6075023 2.77988457,22.8248993 3.3049379,22.52991 C3.65497346,22.3332504 5.05353963,21.8997614 7.50063644,21.2294429 Z"
                        id="path-4"></path>
                      <path
                        d="M20.6,7.13333333 L25.6,13.8 C26.2627417,14.6836556 26.0836556,15.9372583 25.2,16.6 C24.8538077,16.8596443 24.4327404,17 24,17 L14,17 C12.8954305,17 12,16.1045695 12,15 C12,14.5672596 12.1403557,14.1461923 12.4,13.8 L17.4,7.13333333 C18.0627417,6.24967773 19.3163444,6.07059163 20.2,6.73333333 C20.3516113,6.84704183 20.4862915,6.981722 20.6,7.13333333 Z"
                        id="path-5"></path>
                    </defs>
                    <g id="g-app-brand" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                      <g id="Brand-Logo" transform="translate(-27.000000, -15.000000)">
                        <g id="Icon" transform="translate(27.000000, 15.000000)">
                          <g id="Mask" transform="translate(0.000000, 8.000000)">
                            <mask id="mask-2" fill="white">
                              <use xlinkHref="#path-1"></use>
                            </mask>
                            <use fill="currentColor" xlinkHref="#path-1"></use>
                            <g id="Path-3" mask="url(#mask-2)">
                              <use fill="currentColor" xlinkHref="#path-3"></use>
                              <use fillOpacity="0.2" fill="#FFFFFF" xlinkHref="#path-3"></use>
                            </g>
                            <g id="Path-4" mask="url(#mask-2)">
                              <use fill="currentColor" xlinkHref="#path-4"></use>
                              <use fillOpacity="0.2" fill="#FFFFFF" xlinkHref="#path-4"></use>
                            </g>
                          </g>
                          <g
                            id="Triangle"
                            transform="translate(19.000000, 11.000000) rotate(-300.000000) translate(-19.000000, -11.000000) ">
                            <use fill="currentColor" xlinkHref="#path-5"></use>
                            <use fillOpacity="0.2" fill="#FFFFFF" xlinkHref="#path-5"></use>
                          </g>
                        </g>
                      </g>
                    </g>
                  </svg>
                </span>
              </span>
              <span className="app-brand-text demo menu-text fw-bold ms-2">BULL PAY</span>
            </a>
            <a href="#" onClick={toggleMenu} className="layout-menu-toggle menu-link text-large ms-auto">
              <i className="icon-base bx bx-chevron-left"></i>
            </a>
          </div>
          <div className="menu-inner-shadow"></div>
          <ul className="menu-inner py-1">
            <MenuItem to="/app" end icon="bx-home" label={t('nav.dashboard')} />
            <MenuGroup base="/app/balance" icon="bx-wallet" label={t('nav.balance', { defaultValue: 'Balance' })}>
              <SubItem to="/app/balance" end label={t('balance.account', { defaultValue: 'Account' })} />
              <SubItem to="/app/balance/withdrawals" end={true} label={t('balance.withdrawals', { defaultValue: 'Withdrawals' })} />
            </MenuGroup>
            <MenuGroup base="/app/invoices" icon="bx-file" label={t('nav.invoice')}>
              <SubItem to="/app/invoices" end label={t('nav.history')} />
              <SubItem to="/app/invoices/create" end={true} label={t('nav.create')} />
            </MenuGroup>
            <MenuItem to="/app/settings" icon="bx-cog" label={t('nav.settings')} />
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
                {/* Language */}
                <li className="nav-item dropdown-language dropdown me-2 me-xl-0">
                  <a className="nav-link dropdown-toggle hide-arrow" href="#" onClick={(e)=>e.preventDefault()} data-bs-toggle="dropdown">
                    <i className="icon-base bx bx-globe icon-md"></i>
                  </a>
                  <ul className="dropdown-menu dropdown-menu-end">
                    {LANGS.map(lang => (
                      <li key={lang.code}>
                        <a
                          className={`dropdown-item ${i18n.language === lang.code ? 'active' : ''}`}
                          href="#"
                          onClick={(e)=>{ e.preventDefault(); setLanguage(lang) }}
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
                  <a className="nav-link dropdown-toggle hide-arrow" id="nav-theme" href="#" onClick={(e)=>e.preventDefault()} data-bs-toggle="dropdown">
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
                          onClick={()=> setTheme(opt.value)}
                        >
                          <span><i className={`icon-base bx ${opt.icon} icon-md me-3`} data-icon={opt.label.toLowerCase()}></i>{opt.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </li>
                {/* /Theme Switcher */}

                {/* User */}
                <li className="nav-item navbar-dropdown dropdown-user dropdown">
                  <a className="nav-link dropdown-toggle hide-arrow" href="#" onClick={(e)=>e.preventDefault()} data-bs-toggle="dropdown">
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
                      <a className="dropdown-item" href="#" onClick={(e)=>e.preventDefault()}>
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
                            <span className="fw-medium d-block">{user?.name || user?.email || 'User'}</span>
                            <small className="text-muted">{user?.role || 'Member'}</small>
                          </div>
                        </div>
                      </a>
                    </li>
                    <li><div className="dropdown-divider"></div></li>
                    <li>
                      <a className="dropdown-item" href="#" onClick={(e)=>{e.preventDefault(); navigate('/app/settings')}}>
                        <i className="icon-base bx bx-cog icon-md me-3"></i><span>{t('nav.settings')}</span>
                      </a>
                    </li>
                    <li>
                      <a className="dropdown-item" href="#" onClick={(e)=>e.preventDefault()}>
                        <i className="icon-base bx bx-credit-card icon-md me-3"></i><span>{t('user.billing')}</span>
                      </a>
                    </li>
                    <li><div className="dropdown-divider"></div></li>
                    <li>
                      <a className="dropdown-item" href="#" onClick={(e)=>{ e.preventDefault(); logout(); navigate('/login', { replace: true }) }}>
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
            <div>
              <Routes>
                <Route index element={<DashboardHome />} />
                <Route path="invoices" element={<InvoiceList />} />
                <Route path="invoices/create" element={<InvoiceCreate />} />
                <Route path="invoices/:id" element={<InvoiceDetail />} />
                <Route path="invoices/:id/pay" element={<InvoicePayment />} />
                <Route path="settings" element={<Settings />} />
                <Route path="balance" element={<BalanceAccount />} />
                <Route path="balance/withdrawals" element={<BalanceWithdrawals />} />
                <Route path="balance/withdraw/:coinNetworkId" element={<WithdrawRequest />} />
                <Route path="balance/new-address" element={<WalletCreate />} />
                <Route path="wallets" element={<Navigate to="/app/balance/withdrawals" replace />} />
                <Route path="wallets/create" element={<WalletCreate />} />
                <Route path="wallets/:id/edit" element={<WalletEdit />} />
                <Route path="*" element={<Navigate to="." replace />} />
              </Routes>
            </div>
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
