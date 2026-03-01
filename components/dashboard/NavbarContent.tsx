'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/app/providers'
import { formatUsd } from '@/lib/utils/format'
import NotificationDropdown from './NotificationDropdown'

const LANGS = [
  { code: 'th', dir: 'ltr', label: 'ไทย' },
  { code: 'en', dir: 'ltr', label: 'English' },
  { code: 'zh', dir: 'ltr', label: '中文' },
]

interface NavbarContentProps {
  fiatBalance: { currency?: string; amount: string | number }
  notificationRefreshRef: React.MutableRefObject<(() => void) | null>
  theme: string
  setTheme: (theme: string) => void
  language: { code: string; dir: string; label: string }
  setLanguage: (lang: { code: string; dir: string; label: string }) => void
}

export default function NavbarContent({ fiatBalance, notificationRefreshRef, theme, setTheme, language, setLanguage }: NavbarContentProps) {
  const { t, i18n } = useTranslation()
  const { user, logout, isAdmin } = useAuth()

  const initials = String(user?.fullName || user?.name || user?.email || 'U')
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0].toUpperCase())
    .join('')

  return (
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

        {/* Theme Toggle */}
        <li className="nav-item me-2 me-xl-0">
          <a
            className="nav-link"
            href="#"
            onClick={(e) => { e.preventDefault(); setTheme(theme === 'dark' ? 'light' : 'dark') }}
            title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
          >
            <i className={`icon-base bx ${theme === 'dark' ? 'bx-sun' : 'bx-moon'} icon-md`}></i>
          </a>
        </li>

        {/* Notifications */}
        <NotificationDropdown refreshRef={notificationRefreshRef} />

        {/* User */}
        <li className="nav-item navbar-dropdown dropdown-user dropdown">
          <a className="nav-link dropdown-toggle hide-arrow" href="#" onClick={(e) => e.preventDefault()} data-bs-toggle="dropdown">
            <div className="avatar avatar-online">
              {user?.avatarUrl ? (
                <Image src={user.avatarUrl} alt="avatar" width={38} height={38} className="rounded-circle" unoptimized />
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
                        <Image src={user.avatarUrl} alt="avatar" width={40} height={40} className="w-px-40 h-auto rounded-circle" unoptimized />
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
                <Link className="dropdown-item" href="/settings">
                  <i className="icon-base bx bx-cog icon-md me-3"></i><span>{t('nav.settings')}</span>
                </Link>
              </li>
            )}
            <li><div className="dropdown-divider"></div></li>
            <li>
              <a className="dropdown-item" href="#" onClick={(e) => { e.preventDefault(); logout(); window.location.href = '/login' }}>
                <i className="icon-base bx bx-log-out icon-md me-3"></i><span>{t('user.logout')}</span>
              </a>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  )
}
