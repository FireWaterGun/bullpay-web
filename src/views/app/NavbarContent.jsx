import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import { formatUsd } from '../../utils/format'
import NotificationDropdown from './NotificationDropdown'

const LANGS = [
  { code: 'th', dir: 'ltr', label: 'ไทย' },
  { code: 'en', dir: 'ltr', label: 'English' },
  { code: 'zh', dir: 'ltr', label: '中文' },
]

export default function NavbarContent({ fiatBalance, notificationRefreshRef, theme, setTheme, language, setLanguage }) {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user, logout, isAdmin } = useAuth()

  const themeIcon = theme === 'dark' ? 'bx-moon' : theme === 'system' ? 'bx-desktop' : 'bx-sun'

  const initials = (user?.fullName || user?.name || user?.email || 'U')
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0].toUpperCase())
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

        {/* Notifications */}
        <NotificationDropdown refreshRef={notificationRefreshRef} />

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
      </ul>
    </div>
  )
}
