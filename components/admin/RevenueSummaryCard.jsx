'use client'

import { formatChange } from '@/lib/utils/format'

export default function RevenueSummaryCard({ title, value, change, changeLabel, icon, color = 'primary', valueColor }) {
  const isPositive = change >= 0
  const changeColor = isPositive ? 'text-success' : 'text-danger'
  const changeIcon = isPositive ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt'

  return (
    <div className="col-6 col-xl">
      <div className="card h-100">
        <div className="card-body">
          <div className="d-flex align-items-start justify-content-between">
            <div className="content-left">
              <span className="form-label">{title}</span>
              <div className="d-flex align-items-center">
                <h4 className={`mb-0 me-2${valueColor ? ` text-${valueColor}` : ''}`}>{value}</h4>
                {change !== undefined && change !== null && (
                  <small className={changeColor}>
                    <i className={`bx ${changeIcon}`}></i>
                    {typeof change === 'number' ? formatChange(change) : change}{changeLabel && changeLabel !== '%' ? changeLabel : ''}
                  </small>
                )}
              </div>
            </div>
            <div className="avatar">
              <span className={`avatar-initial rounded bg-label-${color}`}>
                <i className={`bx ${icon} bx-sm`}></i>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
