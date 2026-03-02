'use client'

import { useAdminTranslation } from '@/hooks/useAdminTranslation'

export default function WithdrawalDefaultsTable({ defaults }) {
  const { t } = useAdminTranslation()

  return (
    <div className="mb-5">
      <h6 className="text-primary mb-3">
        {t('admin.withdrawal.defaultSettings', { defaultValue: 'Default Settings' })}
      </h6>
      <div className="table-responsive">
        <table className="table table-sm">
          <tbody>
            <tr>
              <td width="30%"><strong>{t('admin.withdrawal.minimum', { defaultValue: 'Minimum' })}</strong></td>
              <td><code>{defaults.minimum || '-'}</code></td>
            </tr>
            <tr>
              <td><strong>{t('admin.withdrawal.maximum', { defaultValue: 'Maximum' })}</strong></td>
              <td><code>{defaults.maximum || '-'}</code></td>
            </tr>
            <tr>
              <td><strong>{t('admin.withdrawal.dailyLimit', { defaultValue: 'Daily Limit' })}</strong></td>
              <td><code>{defaults.dailyLimit || '-'}</code></td>
            </tr>
            <tr>
              <td><strong>{t('admin.withdrawal.monthlyLimit', { defaultValue: 'Monthly Limit' })}</strong></td>
              <td><code>{defaults.monthlyLimit || '-'}</code></td>
            </tr>
            <tr>
              <td><strong>{t('admin.withdrawal.feeType', { defaultValue: 'Fee Type' })}</strong></td>
              <td><span className="badge bg-label-info">{defaults.fee?.type || '-'}</span></td>
            </tr>
            {defaults.fee?.type === 'percentage' && (
              <>
                <tr>
                  <td><strong>{t('admin.withdrawal.feePercentage', { defaultValue: 'Fee %' })}</strong></td>
                  <td><code>{defaults.fee?.percentage || '-'}</code></td>
                </tr>
                <tr>
                  <td><strong>{t('admin.withdrawal.feeMin', { defaultValue: 'Min Fee' })}</strong></td>
                  <td><code>{defaults.fee?.min || '-'}</code></td>
                </tr>
                <tr>
                  <td><strong>{t('admin.withdrawal.feeMax', { defaultValue: 'Max Fee' })}</strong></td>
                  <td><code>{defaults.fee?.max || '-'}</code></td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
