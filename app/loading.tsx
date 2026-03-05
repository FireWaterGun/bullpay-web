export default function RootLoading() {
  return (
    <div className="flex justify-center items-center" style={{ minHeight: '100vh' }}>
      <div className="spinner w-8 h-8 border-3 text-primary-600" role="status">
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  )
}
