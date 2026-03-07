import { Button } from '../../components/ui'

export default function PublicNotFound() {
  return (
    <div className="flex-grow p-6">
      <div className="flex flex-col justify-center items-center py-5">
        <i className="bx bx-search-alt text-primary-600 text-[64px]"></i>
        <h1 className="mt-3 mb-2">404</h1>
        <p className="text-surface-500 mb-4">Page not found</p>
        <Button href="/landing">Go to Home</Button>
      </div>
    </div>
  )
}
