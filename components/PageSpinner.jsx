/**
 * Shared full-page loading spinner.
 * Used as early-return in page components when data is loading.
 *
 * Usage:
 *   if (loading) return <PageSpinner />
 */
export default function PageSpinner() {
  return (
    <div className="flex-grow py-6">
      <div className="flex justify-center items-center py-12">
        <div className="spinner w-8 h-8 border-3 text-primary-600" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    </div>
  )
}
