import { apiFetch } from '@/lib/api-client'

export interface NavigationMenu {
  key: string
  label: string
  path: string
  requiredPermissions?: string[]
  children?: NavigationMenu[]
}

export interface NavigationResponse {
  role: string
  permissions: string[]
  menus: NavigationMenu[]
}

export async function getNavigation(token: string | null): Promise<NavigationResponse> {
  return apiFetch<NavigationResponse>('/api/v1/me/navigation', { token })
}
