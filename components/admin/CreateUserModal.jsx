'use client'

import { useState, useMemo } from 'react'
import { formatRoleLabel } from '@/lib/utils/roles'

/**
 * Roles creatable per caller role — mirrors server-side getCreatableRoles().
 * super_admin/system cannot be created via UI.
 */
const CREATABLE_ROLES_BY_ROLE = {
  super_admin: ['regular_user', 'business_user', 'support_agent', 'admin'],
  admin: ['regular_user', 'business_user', 'support_agent'],
  support_agent: ['regular_user', 'business_user'],
}

export default function CreateUserModal({ t, loading, onClose, onSubmit, callerRole }) {
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const creatableRoles = useMemo(
    () => CREATABLE_ROLES_BY_ROLE[callerRole] || [],
    [callerRole]
  )
  const [role, setRole] = useState('regular_user')
  const [showPassword, setShowPassword] = useState(false)

  function handleSubmit() {
    onSubmit({ email: email.trim(), fullName: fullName.trim() || undefined, password, role })
  }

  const emailTrimmed = email.trim()
  const isValidEmail = emailTrimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)
  const isValid = isValidEmail && password.length >= 8 && password.length <= 128

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !loading && onClose()}>
      <div className="w-full max-w-lg mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-xl shadow-xl">
          <div className="flex items-center justify-between p-5 border-b border-surface-200">
            <h5 className="text-lg font-semibold text-surface-800">
              <i className="bx bx-user-plus mr-2"></i>
              {t('admin.users.createUser', { defaultValue: 'Create User' })}
            </h5>
            <button type="button" className="cursor-pointer text-surface-500 hover:text-surface-700" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="p-5">
            <div className="mb-3">
              <label className="form-label">
                {t('admin.users.email', { defaultValue: 'Email' })} <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className="form-input"
                placeholder={t('admin.users.emailPlaceholder', { defaultValue: 'user@example.com' })}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={255}
                disabled={loading}
                autoFocus
              />
            </div>
            <div className="mb-3">
              <label className="form-label">
                {t('admin.users.fullName', { defaultValue: 'Full Name' })}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={t('admin.users.fullNamePlaceholder', { defaultValue: 'John Doe' })}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                maxLength={255}
                disabled={loading}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">
                {t('admin.users.password', { defaultValue: 'Password' })} <span className="text-danger">*</span>
              </label>
              <div className="flex items-stretch">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-input"
                  placeholder={t('admin.users.passwordPlaceholder', { defaultValue: 'Minimum 8 characters' })}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={128}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <i className={`bx ${showPassword ?'bx-hide' : 'bx-show'}`}></i>
                </button>
              </div>
              {password && password.length < 8 && (
                <small className="text-danger">
                  {t('admin.users.passwordMinLength', { defaultValue: 'Password must be at least 8 characters' })}
                </small>
              )}
              {password && password.length > 128 && (
                <small className="text-danger">
                  {t('admin.users.passwordMaxLength', { defaultValue: 'Password must not exceed 128 characters' })}
                </small>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label">
                {t('admin.users.role', { defaultValue: 'Role' })} <span className="text-danger">*</span>
              </label>
              <select
                className="form-input"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                {creatableRoles.map((r) => (
                  <option key={r} value={r}>{formatRoleLabel(r)}</option>
                ))}
              </select>
            </div>
            <div className="alert alert bg-cyan-50 text-cyan-700 border-cyan-200 py-2 mb-0" role="alert">
              <i className="bx bx-info-circle mr-1"></i>
              {t('admin.users.createInfo', { defaultValue: 'Admin-created users are set as active with email verified by default.' })}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 p-5 border-t border-surface-200">
            <button type="button" className="btn btn border border-surface-300 text-surface-600 bg-transparent hover:bg-surface-100" onClick={onClose} disabled={loading}>
              {t('actions.cancel', { defaultValue: 'Cancel' })}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={loading || !isValid}
            >
              {loading ? (
                <>
                  <span className="spinner w-4 h-4 mr-1"></span>
                  {t('invoices.loading', { defaultValue: 'Loading...' })}
                </>
              ) : (
                <>
                  <i className="bx bx-user-plus mr-1"></i>
                  {t('admin.users.createUserBtn', { defaultValue: 'Create User' })}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
