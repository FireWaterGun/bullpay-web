import { Button } from '../../components/ui'

export default function AuthNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <i className="bx bx-search-alt text-primary-600 text-7xl"></i>
      <h1 className="mt-4 mb-2 text-4xl font-bold">404</h1>
      <p className="text-surface-500 mb-6">Page not found</p>
      <Button href="/login">Go to Login</Button>
    </div>
  )
}
