export const ROLE_ICON = {
  super_admin: 'bx-crown',
  admin: 'bx-shield-alt-2',
  support_agent: 'bx-headphone',
  business_user: 'bx-briefcase',
  regular_user: 'bx-user',
}

export const ROLE_COLOR = {
  super_admin: 'danger',
  admin: 'primary',
  support_agent: 'info',
  business_user: 'warning',
  regular_user: 'secondary',
}

export const ROLE_LEVEL = {
  super_admin: 5,
  admin: 4,
  support_agent: 3,
  business_user: 2,
  regular_user: 1,
}

export const ROLE_DESCRIPTION = {
  super_admin: 'Full system access with all permissions',
  admin: 'Manage users, settings, and operations',
  support_agent: 'Handle support tickets and user issues',
  business_user: 'Merchant and business operations',
  regular_user: 'Standard user with basic permissions',
}

export function formatRoleLabel(role) {
  return String(role || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
