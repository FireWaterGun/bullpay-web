'use client';

import { useTranslation } from 'react-i18next';
import { Badge, Card, Button } from '../ui';

export default function NetworkSelector({ networks, formData, setFormData, isEdit }) {
  const { t } = useTranslation();

  return (
    <Card className="mb-4">
      <div className="px-5 py-4 border-b border-surface-200">
        <h5 className="mb-0">
          <Badge className="bg-primary rounded-full mr-2">2</Badge>
          {isEdit ? t('crypto.network', { defaultValue: 'Network' }) : t('crypto.selectNetwork', { defaultValue: 'Select a network' })}
          <span className="text-danger ml-1">*</span>
        </h5>
      </div>
      <div className="p-5">
        {formData.coinId ?
        <div className="flex flex-wrap gap-2">
            {(isEdit ? networks.filter((n) => n.id === parseInt(formData.networkId)) : networks).map((network) => {
            const selected = formData.networkId === String(network.id);
            return (
              <Button
                type="button"
                key={network.id}

                onClick={() => {
                  if (!isEdit) {
                    setFormData((prev) => ({
                      ...prev,
                      networkId: String(network.id)
                    }));
                  }
                }}
                style={isEdit ? { cursor: 'default' } : {}}>
                
                  {network.symbol} - {network.name}
                </Button>);

          })}
            {networks.length === 0 &&
          <div className="text-surface-500 text-sm">{t('common.noData', { defaultValue: 'No data' })}</div>
          }
          </div> :

        <div className="text-surface-500">{t('crypto.selectCoinFirst', { defaultValue: 'Please select a coin first' })}</div>
        }
      </div>
    </Card>);

}