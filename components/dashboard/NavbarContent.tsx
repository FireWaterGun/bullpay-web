'use client'

import { useEffect, useRef, useState } from 'react'
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

/** Hook for click-outside-to-close dropdown */
function useDropdown(): [React.RefObject<HTMLDivElement | null>, boolean, React.Dispatch<React.SetStateAction<boolean>>] {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return [containerRef, open, setOpen]
}

export default function NavbarContent({
  fiatBalance,
  notificationRefreshRef,
  theme,
  setTheme,
  language,
  setLanguage,
}: NavbarContentProps) {
  const { t, i18n } = useTranslation()
  const { user, logout, isAdmin } = useAuth()

  const [langRef, langOpen, setLangOpen] = useDropdown()
  const [userRef, userOpen, setUserOpen] = useDropdown()

  const initials = String(user?.fullName || user?.name || user?.email || 'U')
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s: string) => s[0].toUpperCase())
    .join('')

  return (
    <div className="flex items-center justify-end flex-1 gap-1">
      {/* Balance */}
      <div className="flex items-center gap-2 px-3 py-1.5 text-surface-700">
        <i className="bx bxs-wallet-alt text-primary-600 dark:text-primary-400 text-xl"></i>
        <span className="hidden md:inline text-[15px] font-medium">{formatUsd(fiatBalance.amount)}</span>
      </div>

      {/* Language Dropdown */}
      <div ref={langRef} className="relative">
        <button
          type="button"
          onClick={() => setLangOpen(!langOpen)}
          className="flex items-center justify-center w-9 h-9 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
          title="Language"
        >
          <i className="bx bx-globe text-xl"></i>
        </button>
        {langOpen && (
          <div className="absolute right-0 z-50 mt-1 min-w-[160px] bg-raised border border-surface-200 rounded-lg shadow-lg py-1">
            {LANGS.map((lang) => (
              <button
                type="button"
                key={lang.code}
                onClick={() => {
                  setLanguage(lang)
                  setLangOpen(false)
                }}
                className={`block w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors ${i18n.language === lang.code ? 'text-primary-600 dark:text-primary-400 font-medium bg-primary-50/50 dark:bg-primary-500/10' : 'text-surface-700 hover:bg-surface-50 dark:hover:bg-white/6'}`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Theme Toggle */}
      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-surface-500 hover:bg-surface-100 dark:hover:bg-white/8 transition-colors cursor-pointer"
        title={theme === 'dark' ? t('theme.light') : t('theme.dark')}
      >
        <i className={`bx ${theme ==='dark' ? 'bx-sun' : 'bx-moon'} text-xl`}></i>
      </button>

      {/* Notifications */}
      <NotificationDropdown refreshRef={notificationRefreshRef} />

      {/* User Dropdown */}
      <div ref={userRef} className="relative">
        <button
          type="button"
          onClick={() => setUserOpen(!userOpen)}
          className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden cursor-pointer"
        >
          {user?.avatarUrl ? (
            <Image
              src={user.avatarUrl}
              alt="avatar"
              width={38}
              height={38}
              className="rounded-full object-cover"
              unoptimized
            />
          ) : (
            <span className="flex items-center justify-center w-full h-full bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 text-sm font-semibold rounded-full">
              {initials}
            </span>
          )}
        </button>
        {userOpen && (
          <div className="absolute right-0 z-50 mt-1 min-w-[220px] bg-raised border border-surface-200 rounded-lg shadow-lg py-1">
            {/* User info header */}
            <div className="px-4 py-3 border-b border-surface-200">
              <div className="flex items-center gap-3">
                <div className="shrink-0">
                  {user?.avatarUrl ? (
                    <Image
                      src={user.avatarUrl}
                      alt="avatar"
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <span className="flex items-center justify-center w-10 h-10 bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 text-sm font-semibold rounded-full">
                      {initials}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-surface-900 truncate">
                    {user?.fullName || user?.name || user?.email || 'User'}
                  </p>
                  <p className="text-xs text-surface-400 truncate">
                    {isAdmin ? (
                      <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold bg-danger-100 dark:bg-danger-950/30 text-danger-600 dark:text-danger-400 rounded">
                        Admin
                      </span>
                    ) : (
                      <span>{user?.role || 'User'}</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            {/* Menu items */}
            {!isAdmin && (
              <Link
                href="/settings"
                onClick={() => setUserOpen(false)}
                className="flex items-center gap-3 px-4 py-2 text-[15px] text-surface-700 hover:bg-surface-50 dark:hover:bg-white/6 transition-colors cursor-pointer whitespace-nowrap"
              >
                <i className="bx bx-cog text-lg"></i>
                <span>{t('nav.settings')}</span>
              </Link>
            )}
            <div className="border-t border-surface-200 my-1"></div>
            <button
              type="button"
              onClick={() => {
                setUserOpen(false)
                logout()
                window.location.href = '/login'
              }}
              className="flex items-center gap-3 w-full px-4 py-2 text-[15px] text-surface-700 hover:bg-surface-50 dark:hover:bg-white/6 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="bx bx-log-out text-lg"></i>
              <span>{t('user.logout')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
