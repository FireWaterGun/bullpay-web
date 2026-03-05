'use client'

import { formatChange } from '@/lib/utils/format'

export default function RevenueSummaryCard({ title, value, change, changeLabel, icon, color = 'primary', valueColor }) {
  const isPositive = change >= 0
  const changeColor = isPositive ? 'text-success' : 'text-danger'
  const changeIcon = isPositive ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt'

  return (
    <div className="col-span-6 col-xl">
      <div className="card h-full">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="content-left">
              <span className="form-label">{title}</span>
              <div className="flex items-center">
                <h4 className={`mb-0 mr-2${valueColor ?` text-${valueColor}` : ''}`}>{value}</h4>
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
