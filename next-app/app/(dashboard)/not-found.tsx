import Link from 'next/link'

export default function DashboardNotFound() {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="d-flex flex-column justify-content-center align-items-center py-5">
        <i className="bx bx-search-alt text-primary" style={{ fontSize: '64px' }}></i>
        <h1 className="mt-3 mb-2">404</h1>
        <p className="text-muted mb-4">Page not found</p>
        <Link href="/dashboard" className="btn btn-primary">
          Go to Dashboard
        </Link>
      </div>
    </div>
  )
}
