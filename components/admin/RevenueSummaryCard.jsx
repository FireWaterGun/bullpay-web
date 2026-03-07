'use client'

import { formatChange } from '@/lib/utils/format'
import AvatarInitial from '@/components/ui/AvatarInitial'
import { bgLabelClass } from '@/components/ui/Badge'
import Card from '@/components/ui/Card'

export default function RevenueSummaryCard({ title, value, change, changeLabel, icon, color = 'primary', valueColor }) {
  const isPositive = change >= 0
  const changeColor = isPositive ? 'text-success' : 'text-danger'
  const changeIcon = isPositive ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt'

  return (
    <div className="col-span-12 sm:col-span-6 xl:col-span-3">
      <Card className="h-full">
        <div className="p-5">
          <div className="flex items-start justify-between">
            <div className="content-left">
              <span className="block text-sm font-medium text-surface-700 mb-1.5">{title}</span>
              <div className="flex items-center">
                <h4
                  className={`mb-0 mr-2${
                    { success: ' text-success', danger: ' text-danger', warning: ' text-warning', info: ' text-info', primary: ' text-primary' }[valueColor] || ''
                  }`}
                >
                  {value}
                </h4>
                {change !== undefined && change !== null && (
                  <small className={changeColor}>
                    <i className={`bx ${changeIcon}`}></i>
                    {typeof change === 'number' ? formatChange(change) : change}
                    {changeLabel && changeLabel !== '%' ? changeLabel : ''}
                  </small>
                )}
              </div>
            </div>
            <div>
              <AvatarInitial className={bgLabelClass(color)}>
                <i className={`bx ${icon} bx-sm`}></i>
              </AvatarInitial>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
