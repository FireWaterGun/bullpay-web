'use client'

import { useAuth } from '@/app/providers'

export default function AdminDashboard() {
  const { user } = useAuth()

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <div className="card mb-6">
            <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
              <h5 className="mb-0">Admin Dashboard</h5>
              <span className="badge bg-primary-50 text-primary-600">Admin Panel</span>
            </div>
            <div className="p-5">
              <div className="alert alert bg-cyan-50 text-cyan-700 border-cyan-200 mb-4" role="alert">
                <h6 className="font-semibold mb-2 mb-2">
                  <i className="bx bx-shield mr-2"></i>
                  Welcome, {user?.fullName || 'Administrator'}!
                </h6>
                <p className="mb-0">
                  You are logged in as an administrator. You have full access to all system features.
                </p>
              </div>

              <div className="grid grid-cols-12 gap-x-6 gap-4">
                <div className="md:col-span-3 sm:col-span-6">
                  <div className="card border shadow-none">
                    <div className="p-5 text-center">
                      <div className="avatar mx-auto mb-3">
                        <span className="avatar-initial rounded-full bg-primary-50 text-primary-600">
                          <i className="bx bx-user bx-lg"></i>
                        </span>
                      </div>
                      <h4 className="mb-1">1,234</h4>
                      <p className="mb-0">Total Users</p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3 sm:col-span-6">
                  <div className="card border shadow-none">
                    <div className="p-5 text-center">
                      <div className="avatar mx-auto mb-3">
                        <span className="avatar-initial rounded-full bg-green-50 text-green-700">
                          <i className="bx bx-receipt bx-lg"></i>
                        </span>
                      </div>
                      <h4 className="mb-1">5,678</h4>
                      <p className="mb-0">Total Invoices</p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3 sm:col-span-6">
                  <div className="card border shadow-none">
                    <div className="p-5 text-center">
                      <div className="avatar mx-auto mb-3">
                        <span className="avatar-initial rounded-full bg-amber-50 text-amber-700">
                          <i className="bx bx-dollar bx-lg"></i>
                        </span>
                      </div>
                      <h4 className="mb-1">$123,456</h4>
                      <p className="mb-0">Total Revenue</p>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-3 sm:col-span-6">
                  <div className="card border shadow-none">
                    <div className="p-5 text-center">
                      <div className="avatar mx-auto mb-3">
                        <span className="avatar-initial rounded-full bg-cyan-50 text-cyan-700">
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
                    <div className="flex w-full justify-between">
                      <h6 className="mb-1">
                        <i className="bx bx-user-circle mr-2"></i>
                        User Management
                      </h6>
                      <small className="text-muted">Coming soon</small>
                    </div>
                    <p className="mb-1">Manage users, roles, and permissions</p>
                  </a>
                  <a href="#" className="list-group-item list-group-item-action">
                    <div className="flex w-full justify-between">
                      <h6 className="mb-1">
                        <i className="bx bx-cog mr-2"></i>
                        System Settings
                      </h6>
                      <small className="text-muted">Coming soon</small>
                    </div>
                    <p className="mb-1">Configure system-wide settings</p>
                  </a>
                  <a href="#" className="list-group-item list-group-item-action">
                    <div className="flex w-full justify-between">
                      <h6 className="mb-1">
                        <i className="bx bx-bar-chart mr-2"></i>
                        Analytics & Reports
                      </h6>
                      <small className="text-muted">Coming soon</small>
                    </div>
                    <p className="mb-1">View detailed analytics and generate reports</p>
                  </a>
                  <a href="#" className="list-group-item list-group-item-action">
                    <div className="flex w-full justify-between">
                      <h6 className="mb-1">
                        <i className="bx bx-history mr-2"></i>
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
