import { Spinner } from '../components/ui'
export default function RootLoading() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <Spinner role="status" size="lg" className="text-primary-600" />

      
    </div>);

}