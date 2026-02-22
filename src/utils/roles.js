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

export function formatRoleLabel(role) {
  return String(role || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
