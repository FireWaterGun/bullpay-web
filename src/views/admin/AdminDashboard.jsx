import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="row">
        <div className="col-12">
          <div className="card mb-6">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Admin Dashboard</h5>
              <span className="badge bg-label-primary">Admin Panel</span>
            </div>
            <div className="card-body">
              <div className="alert alert-info mb-4" role="alert">
                <h6 className="alert-heading mb-2">
                  <i className="bx bx-shield me-2"></i>
                  Welcome, {user?.fullName || 'Administrator'}!
                </h6>
                <p className="mb-0">
                  You are logged in as an administrator. You have full access to all system features.
                </p>
              </div>

              <div className="row g-4">
                {/* Total Users */}
                <div className="col-md-3 col-sm-6">
                  <div className="card border shadow-none">
                    <div className="card-body text-center">
                      <div className="avatar mx-auto mb-3">
                        <span className="avatar-initial rounded-circle bg-label-primary">
                          <i className="bx bx-user bx-lg"></i>
                        </span>
                      </div>
                      <h4 className="mb-1">1,234</h4>
                      <p className="mb-0">Total Users</p>
                    </div>
                  </div>
                </div>

                {/* Total Invoices */}
                <div className="col-md-3 col-sm-6">
                  <div className="card border shadow-none">
                    <div className="card-body text-center">
                      <div className="avatar mx-auto mb-3">
                        <span className="avatar-initial rounded-circle bg-label-success">
                          <i className="bx bx-receipt bx-lg"></i>
                        </span>
                      </div>
                      <h4 className="mb-1">5,678</h4>
                      <p className="mb-0">Total Invoices</p>
                    </div>
                  </div>
                </div>

                {/* Total Revenue */}
                <div className="col-md-3 col-sm-6">
                  <div className="card border shadow-none">
                    <div className="card-body text-center">
                      <div className="avatar mx-auto mb-3">
                        <span className="avatar-initial rounded-circle bg-label-warning">
                          <i className="bx bx-dollar bx-lg"></i>
                        </span>
                      </div>
                      <h4 className="mb-1">$123,456</h4>
                      <p className="mb-0">Total Revenue</p>
                    </div>
                  </div>
                </div>

                {/* Pending Payments */}
                <div className="col-md-3 col-sm-6">
                  <div className="card border shadow-none">
                    <div className="card-body text-center">
                      <div className="avatar mx-auto mb-3">
                        <span className="avatar-initial rounded-circle bg-label-info">
                          <i className="bx bx-time bx-lg"></i>
                        </span>
                      </div>
                      <h4 className="mb-1">89</h4>
                      <p className="mb-0">Pending Payments</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h6 className="mb-4">Admin Features</h6>
                <div className="list-group">
                  <a href="#" className="list-group-item list-group-item-action">
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">
                        <i className="bx bx-user-circle me-2"></i>
                        User Management
                      </h6>
                      <small className="text-muted">Coming soon</small>
                    </div>
                    <p className="mb-1">Manage users, roles, and permissions</p>
                  </a>
                  <a href="#" className="list-group-item list-group-item-action">
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">
                        <i className="bx bx-cog me-2"></i>
                        System Settings
                      </h6>
                      <small className="text-muted">Coming soon</small>
                    </div>
                    <p className="mb-1">Configure system-wide settings</p>
                  </a>
                  <a href="#" className="list-group-item list-group-item-action">
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">
                        <i className="bx bx-bar-chart me-2"></i>
                        Analytics & Reports
                      </h6>
                      <small className="text-muted">Coming soon</small>
                    </div>
                    <p className="mb-1">View detailed analytics and generate reports</p>
                  </a>
                  <a href="#" className="list-group-item list-group-item-action">
                    <div className="d-flex w-100 justify-content-between">
                      <h6 className="mb-1">
                        <i className="bx bx-history me-2"></i>
                        Activity Logs
                      </h6>
                      <small className="text-muted">Coming soon</small>
                    </div>
                    <p className="mb-1">Monitor system activity and user actions</p>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
