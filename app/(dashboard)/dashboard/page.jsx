'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/providers';
import { getUserTransactionSummary, getUserTransactionDaily, getUserTransactionByCoin } from '@/lib/api/userTransactions';
import LocaleDatePicker from '@/components/LocaleDatePicker';
import { formatUsd, formatChange } from '@/lib/utils/format';
import DailyTrendChart from '@/components/dashboard/DailyTrendChart';
import TransactionByCoinTable from '@/components/dashboard/TransactionByCoinTable';
import RefreshButton from '@/components/RefreshButton';
import { logger } from '@/lib/utils/logger';
import { Badge, Button, Card, Select, Spinner } from '../../../components/ui'

function getDateRange(preset) {
  const now = new Date();
  const to = now.toISOString().split('T')[0];
  let from = to;

  switch (preset) {
    case 'today':
      from = to;
      break;
    case 'yesterday':{
        const d = new Date(now);
        d.setDate(d.getDate() - 1);
        from = d.toISOString().split('T')[0];
        break;
      }
    case 'last7days':{
        const d = new Date(now);
        d.setDate(d.getDate() - 6);
        from = d.toISOString().split('T')[0];
        break;
      }
    case 'last30days':{
        const d = new Date(now);
        d.setDate(d.getDate() - 29);
        from = d.toISOString().split('T')[0];
        break;
      }
    case 'thisMonth':{
        from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        break;
      }
    case 'lastMonth':{
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        from = start.toISOString().split('T')[0];
        return { from, to: end.toISOString().split('T')[0] };
      }
    default:
      from = to;
  }
  return { from, to };
}

const colorMap = {
  primary: 'bg-primary-100 text-primary-600',
  danger: 'bg-red-100 text-red-600',
  warning: 'bg-amber-100 text-amber-600',
  info: 'bg-blue-100 text-blue-600',
  success: 'bg-green-100 text-green-600'
};

function SummaryCard({ title, value, change, icon, color = 'primary', valueColor, t }) {
  const numChange = typeof change === 'number' ? change : parseFloat(change);
  const isPositive = numChange >= 0;
  const changeColor = isPositive ? 'text-green-500' : 'text-red-500';
  const changeIcon = isPositive ? 'bx-up-arrow-alt' : 'bx-down-arrow-alt';

  const valueColorClass = valueColor === 'success' ? 'text-green-500' :
  valueColor === 'danger' ? 'text-red-500' :
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

  const dateRangeLabel = useMemo(() => {
    const { from, to } = dateRange;
    if (from === to) return from;
    const fromDate = new Date(from + 'T00:00:00');
    const toDate = new Date(to + 'T00:00:00');
    const fmtDate = (d) => d.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    return `${fmtDate(fromDate)} - ${fmtDate(toDate)}`;
  }, [dateRange, locale]);

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, [token, dateRange]);

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
        <div className="flex gap-2 flex-nowrap items-center ml-auto">
          <Badge className="bg-surface-100 text-surface-600 text-base font-normal px-3 py-2 hidden sm:inline rounded-lg">
            {dateRangeLabel}
          </Badge>
          {!showCustom ?
          <>
              <Select

              value={datePreset}
              onChange={(e) => setDatePreset(e.target.value)} className="w-auto">
              
                <option value="today">{t('filter.today', { defaultValue: 'Today' })}</option>
                <option value="yesterday">{t('filter.yesterday', { defaultValue: 'Yesterday' })}</option>
                <option value="last7days">{t('filter.last7days', { defaultValue: 'Last 7 Days' })}</option>
                <option value="last30days">{t('filter.last30days', { defaultValue: 'Last 30 Days' })}</option>
                <option value="thisMonth">{t('filter.thisMonth', { defaultValue: 'This Month' })}</option>
                <option value="lastMonth">{t('filter.lastMonth', { defaultValue: 'Last Month' })}</option>
              </Select>
              <Button

              onClick={() => setShowCustom(true)} variant="outline-secondary" className="whitespace-nowrap">
              
                <i className="bx bx-calendar mr-1"></i>
                {t('filter.custom', { defaultValue: 'Custom' })}
              </Button>
            </> :

          <>
              <LocaleDatePicker
              value={customFrom}
              onChange={setCustomFrom}
              locale={locale}
              placeholder={t('filter.from', { defaultValue: 'From' })}
              t={t}
              maxDate={customTo ? customTo : undefined}
              minDate={customTo ? (() => {const d = new Date(customTo + 'T00:00:00');d.setMonth(d.getMonth() - 2);return d.toISOString().split('T')[0];})() : undefined} />
            
              <span className="self-center">–</span>
              <LocaleDatePicker
              value={customTo}
              onChange={setCustomTo}
              locale={locale}
              placeholder={t('filter.to', { defaultValue: 'To' })}
              t={t}
              minDate={customFrom ? customFrom : undefined}
              maxDate={customFrom ? (() => {const d = new Date(customFrom + 'T00:00:00');d.setMonth(d.getMonth() + 2);return d.toISOString().split('T')[0];})() : undefined} />
            
              <Button

              onClick={() => {
                setShowCustom(false);
                setCustomFrom('');
                setCustomTo('');
              }} variant="outline-secondary" className="whitespace-nowrap">
              
                <i className="bx bx-reset mr-1"></i>
                {t('filter.reset', { defaultValue: 'Reset' })}
              </Button>
            </>
          }
        </div>
      </div>

      {error &&
      <div className="rounded-lg bg-red-50 text-red-700 px-4 py-3 text-sm mb-4">{error}</div>
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
          <div className="px-6 py-4 border-b border-surface-100">
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