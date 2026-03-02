import { apiFetch } from '@/lib/api-client'

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
  return apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body,
    skipAuthRedirect: true,
  })
}

export async function registerApi(body: RegisterRequest) {
  return apiFetch('/api/v1/auth/register', {
    method: 'POST',
    body,
    skipAuthRedirect: true,
  })
}

export async function forgotPasswordApi(body: ForgotPasswordRequest) {
  return apiFetch('/api/v1/auth/forgot-password', {
    method: 'POST',
    body,
  })
}

export interface VerifyEmailParams {
  token: string
  email?: string
}

export async function verifyEmailApi({ token, email }: VerifyEmailParams) {
  return apiFetch('/api/v1/auth/verify-email', {
    method: 'POST',
    body: { token, email },
  })
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  newPasswordConfirmation: string
}

export async function changePasswordApi(token: string | null, body: ChangePasswordRequest) {
  return apiFetch('/api/v1/auth/change-password', {
    method: 'POST',
    token,
    body,
  })
}
