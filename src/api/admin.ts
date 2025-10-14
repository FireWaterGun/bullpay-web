import { apiFetch } from './client'

/**
 * Get system wallet statistics (Admin only)
 * @param token - Auth token
 * @param currency - Currency code (e.g., 'USD', 'THB'), empty string for crypto amounts
 */
export async function getSystemWalletStats(token: string, currency: string = '') {
  const url = currency 
    ? `/admin/system-wallets/stats?currency=${currency}`
    : '/admin/system-wallets/stats'
    
  const data = await apiFetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  
  // apiFetch already returns parsed JSON
  return data.data || data
}
