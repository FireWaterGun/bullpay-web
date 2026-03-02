/**
 * Shared full-page loading spinner.
 * Used as early-return in page components when data is loading.
 *
 * Usage:
 *   if (loading) return <PageSpinner />
 */
export default function PageSpinner() {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  )
}
