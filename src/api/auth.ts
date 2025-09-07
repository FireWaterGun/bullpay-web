import { apiFetch } from './client'
import { requestId } from '../utils/requestId'

export interface LoginRequest {
  email: string
  password: string
  cfToken: string
}
export interface RegisterRequest {
  fullName: string
  email: string
  password: string
  confirmPassword: string
  cfToken: string
}
export interface ForgotPasswordRequest {
  email: string
  cfToken: string
}

export async function loginApi(body: LoginRequest) {
  return apiFetch('/auth/login', {
    method: 'POST',
    headers: { 'x-request-id': requestId() },
    body,
  })
}

export async function registerApi(body: RegisterRequest) {
  return apiFetch('/auth/register', {
    method: 'POST',
    headers: { 'x-request-id': requestId() },
    body,
  })
}

export async function forgotPasswordApi(body: ForgotPasswordRequest) {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    headers: { 'x-request-id': requestId() },
    body,
  })
}

export interface VerifyEmailParams {
  token: string
  email?: string
}

export async function verifyEmailApi({ token, email }: VerifyEmailParams) {
  // Call the official endpoint only, as per backend contract
  return apiFetch('/auth/verify-email', {
    method: 'POST',
    headers: { 'x-request-id': requestId() },
    body: { token, email },
  })
}
