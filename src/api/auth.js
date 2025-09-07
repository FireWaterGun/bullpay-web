import { apiFetch } from './client'
import { requestId } from '../utils/requestId'

export async function loginApi({ email, password, cfToken }) {
  return apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'x-request-id': requestId() },
    body: { email, password, cfToken },
  })
}

export async function registerApi({ fullName, email, password, confirmPassword, cfToken }) {
  return apiFetch('/auth/register', {
    method: 'POST',
    headers: { 'x-request-id': requestId() },
    body: { fullName, email, password, confirmPassword, cfToken },
  })
}

export async function forgotPasswordApi({ email, cfToken }) {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    headers: { 'x-request-id': requestId() },
    body: { email, cfToken },
  })
}

// Deprecated: use ./auth.ts instead. Kept for compatibility during TS migration.
export * from './auth.ts'