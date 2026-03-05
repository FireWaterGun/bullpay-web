import { Spinner } from './ui'
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
        <Spinner role="status" size="lg" className="text-primary-600" />

        
      </div>
    </div>);

}