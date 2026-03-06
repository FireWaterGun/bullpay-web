'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/providers';
import { getUserTransactionSummary, getUserTransactionDaily, getUserTransactionByCoin } from '@/lib/api/userTransactions';
import { formatUsd, formatChange } from '@/lib/utils/format';
import DailyTrendChart from '@/components/dashboard/DailyTrendChart';
import TransactionByCoinTable from '@/components/dashboard/TransactionByCoinTable';
import DateFilterBar from '@/components/dashboard/DateFilterBar';
import RefreshButton from '@/components/RefreshButton';
import { logger } from '@/lib/utils/logger';
import { Card, Spinner } from '@/components/ui'
import { getDateRange } from '@/lib/utils/dateRange'

const colorMap = {
  primary: 'bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
  danger: 'bg-danger-100 text-danger-600 dark:bg-danger-500/15 dark:text-danger-400',
  warning: 'bg-warning-100 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400',
  info: 'bg-info-100 text-info-600 dark:bg-info-500/15 dark:text-info-400',
  success: 'bg-success-100 text-success-600 dark:bg-success-500/15 dark:text-success-400'
};

function SummaryCard({ title, value, change, icon, color = 'primary', valueColor, t }) {
  const numChange = typeof change === 'number' ? change : parseFloat(change);
  const isPositive = numChange >= 0;
  const changeColor = isPositive ? 'text-success-500' : 'text-danger-500';
  const changeIcon = isPositive ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt';

  const valueColorClass = valueColor === 'success' ? 'text-success-500' :
  valueColor === 'danger' ? 'text-danger-500' :
  'text-surface-900';

  return (
    <div className="col-span-6 xl:col-span-3">
      <Card className="h-full">
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-surface-500 text-sm">{title}</span>
              <h3 className={`mb-0 text-[1.75rem] font-semibold ${valueColorClass}`}>{value}</h3>
              {change !== undefined && change !== null && !isNaN(numChange) &&
              <small className={`${changeColor} text-[0.8rem]`}>
                  <i className={`bx ${changeIcon}`}></i>
                  {formatChange(numChange)} {t ? t('userDashboard.vsPrev', { defaultValue: 'vs prev' }) : 'vs prev'}
                </small>
              }
            </div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${colorMap[color] || colorMap.primary}`}>
              <i className={`bx ${icon} text-xl`}></i>
            </div>
          </div>
        </div>
      </Card>
    </div>);

}

export default function UserTransactionsDashboard() {
  const { t, i18n } = useTranslation();
  const { token } = useAuth();

  const locale = useMemo(() => {
    const map = { en: 'en-US', th: 'th-TH', zh: 'zh-CN' };
    return map[i18n.language] || 'en-US';
  }, [i18n.language]);

  const [datePreset, setDatePreset] = useState('thisMonth');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const [summary, setSummary] = useState(null);
  const [dailyData, setDailyData] = useState([]);
  const [dailyMeta, setDailyMeta] = useState(null);

  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [byCoinData, setByCoinData] = useState([]);
  const [loadingByCoin, setLoadingByCoin] = useState(false);
  const [error, setError] = useState('');

  const dateRange = useMemo(() => {
    if (showCustom && customFrom && customTo) {
      return { from: customFrom, to: customTo };
    }
    return getDateRange(datePreset);
  }, [datePreset, showCustom, customFrom, customTo]);

  const loadData = useCallback(async () => {
    if (!token || !dateRange.from || !dateRange.to) return;
    setError('');
    setLoadingSummary(true);
    setLoadingDaily(true);
    setLoadingByCoin(true);

    const [summaryResult, dailyResult, byCoinResult] = await Promise.allSettled([
    getUserTransactionSummary(token, dateRange.from, dateRange.to),
    getUserTransactionDaily(token, dateRange.from, dateRange.to),
    getUserTransactionByCoin(token, dateRange.from, dateRange.to)]
    );

    if (summaryResult.status === 'fulfilled') {
      setSummary(summaryResult.value);
    } else {
      logger.error('Failed to load transaction summary:', summaryResult.reason);
      setError(summaryResult.reason?.message || 'Failed to load summary');
    }
    setLoadingSummary(false);

    if (dailyResult.status === 'fulfilled') {
      const res = dailyResult.value;
      const items = res?.items || res || [];
      setDailyData(items.map((item) => ({
        date: item.date,
        deposit: parseFloat(item.depositUsd || 0),
        withdrawal: parseFloat(item.withdrawalUsd || 0),
        netFlow: parseFloat(item.netFlowUsd || 0)
      })));
      setDailyMeta(res?.meta || null);
    } else {
      logger.error('Failed to load daily data:', dailyResult.reason);
    }
    setLoadingDaily(false);

    if (byCoinResult.status === 'fulfilled') {
      const res = byCoinResult.value;
      setByCoinData(res?.items || res || []);
    } else {
      logger.error('Failed to load by-coin data:', byCoinResult.reason);
    }
    setLoadingByCoin(false);
  }, [token, dateRange]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadData();
    });
  }, [loadData]);

  const current = summary?.current || {};
  const changes = summary?.changes || {};

  return (
    <>
      {/* Header */}
      <div className="flex flex-wrap items-center mb-6 gap-3">
        <h4 className="text-xl font-semibold text-surface-900 mb-0">
          <i className="bx bx-bar-chart-alt-2 text-primary-600 mr-2"></i>
          {t('nav.dashboard', { defaultValue: 'Dashboard' })}
        </h4>
        <RefreshButton onClick={loadData} loading={loadingSummary || loadingDaily || loadingByCoin} />
        <div className="ml-auto">
          <DateFilterBar
            locale={locale}
            t={t}
            datePreset={datePreset}
            onPresetChange={setDatePreset}
            customFrom={customFrom}
            onCustomFromChange={setCustomFrom}
            customTo={customTo}
            onCustomToChange={setCustomTo}
            showCustom={showCustom}
            onShowCustomChange={setShowCustom}
          />
        </div>
      </div>

      {error &&
      <div className="rounded-lg bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-400 px-4 py-3 text-sm mb-4">{error}</div>
      }

      {/* KPI Summary Cards */}
      {loadingSummary ?
      <div className="flex justify-center py-10 mb-6">
          <Spinner size="lg" className="text-primary-600" />
        </div> :

      <div className="grid grid-cols-12 gap-4 mb-6">
          <SummaryCard
          title={t('userDashboard.deposits', { defaultValue: 'Deposits' })}
          value={formatUsd(current.totalDepositUsd)}
          change={changes.depositPercent}
          icon="bx-wallet"
          color="primary"
          t={t} />
        
          <SummaryCard
          title={t('userDashboard.withdrawals', { defaultValue: 'Withdrawals' })}
          value={formatUsd(current.totalWithdrawalUsd)}
          change={changes.withdrawalPercent}
          icon="bx-transfer-alt"
          color="danger"
          t={t} />
        
          <SummaryCard
          title={t('userDashboard.feesCollected', { defaultValue: 'Fees Collected' })}
          value={formatUsd(current.totalFeeUsd)}
          change={changes.feePercent}
          icon="bx-dollar-circle"
          color="warning"
          t={t} />
        
          <SummaryCard
          title={t('userDashboard.netFlow', { defaultValue: 'Net Flow' })}
          value={formatUsd(current.netFlowUsd)}
          change={changes.netFlowPercent}
          icon="bx-line-chart"
          color="info"
          valueColor={(() => {const nf = parseFloat(current.netFlowUsd || 0);return nf > 0 ? 'success' : nf < 0 ? 'danger' : undefined;})()}
          t={t} />
        
        </div>
      }

      {/* Daily Trend Chart */}
      <div className="mb-6">
        <Card>
          <div className="px-6 py-4 border-b border-surface-200">
            <h5 className="text-base font-semibold text-surface-900 mb-0">
              <i className="bx bx-bar-chart-alt-2 text-primary-600 mr-2"></i>
              {t('userDashboard.dailyTrend', { defaultValue: 'Daily Trend Chart' })}
            </h5>
          </div>
          <div className="p-6">
            {loadingDaily ?
            <div className="flex justify-center py-10">
                <Spinner size="lg" className="text-primary-600" />
              </div> :

            <DailyTrendChart data={dailyData} meta={dailyMeta} height={300} locale={locale} t={t} />
            }
          </div>
        </Card>
      </div>

      {/* Transaction by Coin */}
      <div className="mb-6">
        <TransactionByCoinTable byCoinData={byCoinData} loading={loadingByCoin} t={t} />
      </div>
    </>);

}