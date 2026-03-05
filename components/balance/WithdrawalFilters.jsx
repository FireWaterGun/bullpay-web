'use client';

import { useState } from 'react';
import { WITHDRAWAL_STATUSES, formatStatusLabel } from './withdrawalHelpers';
import { Button, Card, Input, Label, Select } from '../ui'

const EMPTY_COINS = [];

export default function WithdrawalFilters({ filters, onFilterChange, coins = EMPTY_COINS, onReset, t }) {
  const [expanded, setExpanded] = useState(false);

  function update(key, value) {
    onFilterChange({ ...filters, [key]: value });
  }

  return (
    <Card className="mb-3">
      <div className="px-5 py-4 border-b border-surface-200 py-2 flex justify-between items-center">
        <span className="font-semibold text-sm">
          <i className="bx bx-filter-alt mr-1"></i>
          {t?.('withdrawals.filters', { defaultValue: 'Filters' }) || 'Filters'}
        </span>
        <div className="flex gap-2">
          {onReset &&
          <Button onClick={onReset} size="sm" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none">
              {t?.('actions.reset', { defaultValue: 'Reset' }) || 'Reset'}
            </Button>
          }
          <Button onClick={() => setExpanded(!expanded)} size="sm" className="bg-transparent text-surface-600 hover:bg-surface-100 shadow-none">
            <i className={`bx ${expanded ? 'bx-chevron-up' : 'bx-chevron-down'}`}></i>
          </Button>
        </div>
      </div>
      {expanded &&
      <div className="p-5 py-2">
          <div className="grid grid-cols-12 gap-x-6 gap-2">
            <div className="md:col-span-3">
              <Label className="text-sm">{t?.('withdrawals.status', { defaultValue: 'Status' }) || 'Status'}</Label>
              <Select

              value={filters.status || ''}
              onChange={(e) => update('status', e.target.value)} className="text-sm py-1">
              
                <option value="">{t?.('common.all', { defaultValue: 'All' }) || 'All'}</option>
                {WITHDRAWAL_STATUSES.map((s) =>
              <option key={s} value={s}>{formatStatusLabel(s)}</option>
              )}
              </Select>
            </div>
            <div className="md:col-span-3">
              <Label className="text-sm">{t?.('withdrawals.search', { defaultValue: 'Search' }) || 'Search'}</Label>
              <Input
              type="text"

              placeholder={t?.('withdrawals.searchPlaceholder', { defaultValue: 'Search...' }) || 'Search...'}
              value={filters.q || ''}
              onChange={(e) => update('q', e.target.value)} className="text-sm py-1" />
            
            </div>
          </div>
        </div>
      }
    </Card>);

}