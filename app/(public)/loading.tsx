import { Spinner } from '../../components/ui'
export default function PublicLoading() {
  return (
    <div className="flex justify-center items-center min-h-[80vh]">
      <Spinner role="status" size="lg" className="text-primary-600" />

      
    </div>);

}