import useSWR from 'swr'
import { useAuth } from '@/app/providers'

/**
 * Generic SWR wrapper for authenticated API calls.
 *
 * @param {string | any[] | null | undefined | false} key - SWR cache key.
 *   Pass `null` or `false` to skip fetching (conditional fetch).
 *   String keys are auto-prefixed with token for dedup.
 * @param {(token: string) => Promise<any>} fetcher - Async function receiving the auth token.
 * @param {import('swr').SWRConfiguration} [options] - SWR options override.
 * @returns {import('swr').SWRResponse & { token: string | null }}
 *
 * @example
 * // Simple detail page
 * const { data: invoice, isLoading, mutate } = useApi(
 *   id ? `invoice-${id}` : null,
 *   (token) => getInvoice(token, id)
 * )
 *
 * @example
 * // List with pagination
 * const { data, isLoading, mutate } = useApi(
 *   ['invoices', page, status],
 *   (token) => listInvoices(token, { page, status })
 * )
 */
export default function useApi(key, fetcher, options) {
  const { token } = useAuth()

  // Build the actual SWR key: null when no token or key is falsy
  const swrKey = token && key ? (Array.isArray(key) ? [token, ...key] : [token, key]) : null

  const result = useSWR(swrKey, () => fetcher(token), options)

  return { ...result, token }
}
