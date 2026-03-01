export default function DashboardLoading() {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    </div>
  )
}
