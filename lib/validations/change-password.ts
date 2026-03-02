import { z } from 'zod'

/**
 * Shared password validation schema used by both user and admin change-password forms.
 * Must stay in sync with server-side VineJS validator in validators/auth.ts.
 *
 * Server rules: minLength(8), maxLength(128), regex with uppercase/lowercase/digit/special
 */
export const newPasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'At least one lowercase letter')
  .regex(/[A-Z]/, 'At least one uppercase letter')
  .regex(/[0-9]/, 'At least one number')
  .regex(/[^A-Za-z0-9]/, 'At least one special character')

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string()
      .min(1, 'Current password is required')
      .max(128, 'Password must be at most 128 characters'),
    newPassword: newPasswordSchema,
    newPasswordConfirmation: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.newPasswordConfirmation, {
    message: 'Passwords do not match',
    path: ['newPasswordConfirmation'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  })
