/**
 * Shared formatting helpers for admin settings pages
 * (rbf-settings, gas-settings, withdrawal-settings)
 */

export function formatMs(v) {
  const ms = Number(v);
  if (isNaN(ms) || v === '' || v === null || v === undefined || v === '—') return '—';
  if (ms >= 3600_000) {
    const h = ms / 3600_000;
    return h % 1 === 0 ? `${h}h` : `${(ms / 60_000).toFixed(0)}m`;
  }
  return `${(ms / 60_000).toFixed(0)}m`;
}

export function formatPercent(v) {
  if (v === undefined || v === '' || v === null || v === '—') return '—';
  return `${v}%`;
}

export function formatRatio(v) {
  const n = Number(v);
  if (isNaN(n) || v === '' || v === null || v === undefined) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

export function formatUsd(v) {
  if (v === undefined || v === '' || v === null || v === '—') return '—';
  return `$${v}`;
}

export function formatAmount(val) {
  if (val == null || val === '') return '-';
  const num = parseFloat(val);
  if (isNaN(num)) return val;
  if (Math.abs(num) < 1e-6 && num !== 0) return val;
  return num.toLocaleString('en-US', { maximumFractionDigits: 18, useGrouping: false });
}
