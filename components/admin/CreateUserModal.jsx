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
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => !loading && onClose()}>
      <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bx bx-user-plus me-2"></i>
              {t('admin.users.createUser', { defaultValue: 'Create User' })}
            </h5>
            <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
          </div>
          <div className="modal-body">
            <div className="mb-3">
              <label className="form-label">
                {t('admin.users.email', { defaultValue: 'Email' })} <span className="text-danger">*</span>
              </label>
              <input
                type="email"
                className="form-control"
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
                className="form-control"
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
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder={t('admin.users.passwordPlaceholder', { defaultValue: 'Minimum 8 characters' })}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  maxLength={128}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'}`}></i>
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
                className="form-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                disabled={loading}
              >
                {creatableRoles.map((r) => (
                  <option key={r} value={r}>{formatRoleLabel(r)}</option>
                ))}
              </select>
            </div>
            <div className="alert alert-info py-2 mb-0" role="alert">
              <i className="bx bx-info-circle me-1"></i>
              {t('admin.users.createInfo', { defaultValue: 'Admin-created users are set as active with email verified by default.' })}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline-secondary" onClick={onClose} disabled={loading}>
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
                  <span className="spinner-border spinner-border-sm me-1"></span>
                  {t('invoices.loading', { defaultValue: 'Loading...' })}
                </>
              ) : (
                <>
                  <i className="bx bx-user-plus me-1"></i>
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
