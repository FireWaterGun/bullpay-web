/** @type {import('swr').SWRConfiguration} */
export const swrDefaults = {
  revalidateOnFocus: false,
  shouldRetryOnError: false,
  dedupingInterval: 2_000,
}
