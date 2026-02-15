import { apiFetch } from './client'

export interface NavigationMenu {
  key: string
  label: string
  path: string
  permission: string
  children?: NavigationMenu[]
}

export interface NavigationResponse {
  role: string
  permissions: string[]
  menus: NavigationMenu[]
}

/**
 * Get navigation menus and permissions for the current user
 * @param token - Auth token
 */
export async function getNavigation(token: string): Promise<NavigationResponse> {
  const data = await apiFetch('/api/v1/me/navigation', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return data?.data || data
}
