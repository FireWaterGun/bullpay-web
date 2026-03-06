import { Alert, Badge, Button, Card } from '@/components/ui';
import { formatMs } from '@/lib/utils/settingsFormatters';

export default function RbfGlobalTab({ t, getVal, openGlobalEdit }) {
  return (
    <>
      <Alert variant="primary" className="mb-4">
        <i className="bx bx-info-circle mr-1"></i>
        {t('admin.rbfSettings.globalInfo', {
          defaultValue: 'Global RBF settings apply across all networks. These control dropped transaction detection, system-wide rate limiting, and safety limits.',
        })}
      </Alert>

      {/* Dropped Detection */}
      <Card className="mb-3">
        <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
          <div>
            <h6 className="mb-0">
              <i className="bx bx-search-alt mr-1 text-warning"></i>
              {t('admin.rbfSettings.droppedDetection', { defaultValue: 'Dropped Transaction Detection' })}
            </h6>
            <small className="text-surface-500">
              {t('admin.rbfSettings.droppedDetectionDesc', { defaultValue: 'When a transaction disappears from the mempool for too long, it is considered dropped' })}
            </small>
          </div>
          <Button onClick={() => openGlobalEdit('droppedDetection')} title={t('admin.rbfSettings.edit', { defaultValue: 'Edit' })} size="sm" className="text-secondary">
            <i className="bx bx-edit text-[1rem]"></i>
          </Button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-12 gap-x-6 gap-4">
            <div className="md:col-span-6">
              <div className="text-surface-500 text-sm">{t('admin.rbfSettings.minNotFoundCount', { defaultValue: 'Min Not-Found Checks' })}</div>
              {(() => {
                const val = getVal('rbf.dropped_detection.min_not_found_count');
                return (
                  <>
                    <div className="font-semibold text-xl">{val}</div>
                    {val !== '—' && <div className="text-surface-500 text-sm">{t('admin.rbfSettings.consecutiveChecks', { defaultValue: 'consecutive checks' })}</div>}
                  </>
                );
              })()}
            </div>
            <div className="md:col-span-6">
              <div className="text-surface-500 text-sm">{t('admin.rbfSettings.minNotFoundDuration', { defaultValue: 'Min Not-Found Duration' })}</div>
              {(() => {
                const raw = getVal('rbf.dropped_detection.min_not_found_duration', '');
                const formatted = formatMs(raw);
                return (
                  <>
                    <div className="font-semibold text-xl">{formatted}</div>
                    {formatted !== '—' && <div className="text-surface-500 text-sm">{raw} ms</div>}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </Card>

      {/* Rate Limiting */}
      <Card className="mb-3">
        <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
          <div>
            <h6 className="mb-0">
              <i className="bx bx-shield mr-1 text-info"></i>
              {t('admin.rbfSettings.rateLimiting', { defaultValue: 'Rate Limiting' })}
            </h6>
            <small className="text-surface-500">
              {t('admin.rbfSettings.rateLimitingDesc', { defaultValue: 'Prevents excessive RBF replacements that could waste gas fees' })}
            </small>
          </div>
          <Button onClick={() => openGlobalEdit('rateLimiting')} title={t('admin.rbfSettings.edit', { defaultValue: 'Edit' })} size="sm" className="text-secondary">
            <i className="bx bx-edit text-[1rem]"></i>
          </Button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-12 gap-x-6 gap-4">
            <div className="md:col-span-6">
              <div className="text-surface-500 text-sm">{t('admin.rbfSettings.maxRbfPerHour', { defaultValue: 'Max RBF Per Hour' })}</div>
              {(() => {
                const val = getVal('rbf.rate_limiting.max_rbf_per_hour');
                return (
                  <>
                    <div className="font-semibold text-xl">{val}</div>
                    {val !== '—' && <div className="text-surface-500 text-sm">{t('admin.rbfSettings.systemWide', { defaultValue: 'system-wide' })}</div>}
                  </>
                );
              })()}
            </div>
            <div className="md:col-span-6">
              <div className="text-surface-500 text-sm">{t('admin.rbfSettings.maxRbfPerAddress', { defaultValue: 'Max RBF Per Address' })}</div>
              {(() => {
                const val = getVal('rbf.rate_limiting.max_rbf_per_address');
                return (
                  <>
                    <div className="font-semibold text-xl">{val}</div>
                    {val !== '—' && <div className="text-surface-500 text-sm">{t('admin.rbfSettings.perAddress', { defaultValue: 'per address' })}</div>}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </Card>

      {/* Safety */}
      <Card className="mb-3">
        <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
          <div>
            <h6 className="mb-0">
              <i className="bx bx-lock-alt mr-1 text-danger"></i>
              {t('admin.rbfSettings.safety', { defaultValue: 'Safety Limits' })}
            </h6>
            <small className="text-surface-500">
              {t('admin.rbfSettings.safetyDesc', { defaultValue: 'Hard limits to prevent runaway replacement loops' })}
            </small>
          </div>
          <Button onClick={() => openGlobalEdit('safety')} title={t('admin.rbfSettings.edit', { defaultValue: 'Edit' })} size="sm" className="text-secondary">
            <i className="bx bx-edit text-[1rem]"></i>
          </Button>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-12 gap-x-6 gap-4">
            <div className="md:col-span-6">
              <div className="text-surface-500 text-sm">{t('admin.rbfSettings.maxReplacementsPerTx', { defaultValue: 'Max Replacements Per Tx' })}</div>
              {(() => {
                const val = getVal('rbf.safety.max_replacements_per_tx');
                return (
                  <>
                    <div className="font-semibold text-xl">{val}</div>
                    {val !== '—' && <div className="text-surface-500 text-sm">{t('admin.rbfSettings.perTransaction', { defaultValue: 'per transaction' })}</div>}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </Card>
    </>
  );
}
