import { redirect } from 'next/navigation'
import { getToken, isAdmin } from '@/lib/auth'

/**
 * Root page — redirects based on auth state.
 * This mirrors the RootHandler logic from the Vite SPA.
 */
export default async function RootPage() {
  const token = await getToken()

  if (!token) {
    redirect('/landing')
  }

  if (await isAdmin()) {
    redirect('/admin/dashboard')
  }

  redirect('/dashboard')
}
