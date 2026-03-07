import useSWR from 'swr'
import { useAuth } from '@/app/providers'
import { listCoins } from '@/lib/api/coins'

/**
 * SWR hook for fetching coin networks.
 * Deduplicates across all components — only one fetch per session.
 *
 * @param {object} [options]
 * @param {boolean} [options.publicMode] - If true, fetches without auth token (for public pages like pay-select)
 * @returns {{ coins: import('@/lib/api/coins').CoinNetworkItem[], isLoading: boolean, error: any, mutate: Function }}
 */
export function useCoins({ publicMode = false } = {}) {
  const { token } = useAuth()

  const key = publicMode ? 'coins:public' : token ? ['coins', token] : null

  const { data, error, isLoading, mutate } = useSWR(key, () => listCoins(publicMode ? undefined : token), {
    dedupingInterval: 60_000,
    revalidateOnFocus: false,
    revalidateIfStale: false,
  })

  return {
    coins: data || [],
    isLoading,
    error,
    mutate,
  }
}
