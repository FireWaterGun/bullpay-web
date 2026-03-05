import { Spinner } from '../../components/ui'
export default function DashboardLoading() {
  return (
    <div className="flex justify-center items-center py-12">
      <Spinner size="lg" className="text-primary-600" />
    </div>);

}