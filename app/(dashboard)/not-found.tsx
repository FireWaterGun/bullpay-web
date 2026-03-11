import Button from '@/components/ui/Button'

export default function DashboardNotFound() {
  return (
    <div className="flex flex-col justify-center items-center py-12">
      <i className="bx bx-search-alt text-primary-600 text-6xl"></i>
      <h1 className="mt-3 mb-2 font-bold text-surface-900">404</h1>
      <p className="text-surface-500 mb-4">Page not found</p>
      <Button href="/dashboard">Go to Dashboard</Button>
    </div>
  )
}
