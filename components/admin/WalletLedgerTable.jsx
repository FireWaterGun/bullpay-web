'use client';

import { AmountNormalizer } from '@/lib/utils/amount_normalizer';
import { formatUsd } from '@/lib/utils/format';
import { useDateFormat } from '@/hooks/useDateFormat';
import CoinImg from '@/components/CoinImg';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import CardEmptyState from '@/components/CardEmptyState';
import Badge from '../ui/Badge'
import Spinner from '../ui/Spinner'
import Button from '../ui/Button'
import Table from '../ui/Table';

function formatAmount(val) {
  if (!val && val !== 0) return '0';
  let str = String(val);
  if (str.includes('.')) {
    str = str.replace(/0+$/, '').replace(/\.$/, '');
  }
  return str || '0';
}

function parseMetadata(entry) {
  try {
    return typeof entry.metadata === 'string' ? JSON.parse(entry.metadata) : entry.metadata || {};
  } catch {return {};}
}

function getPurposeLabel(metadata) {
  if (!metadata) return null;
  const purposeMap = {
    'payment_received': 'Payment Received',
    'merchant_credit': 'Merchant Credit',
    'native_coin_sweep_cost': 'Sweep Cost',
    'gas_topup_for_token_sweep': 'Gas Top-up',
    'token_sweep_cost': 'Token Sweep Cost'
  };
  return purposeMap[metadata.purpose] || purposeMap[metadata.type] || metadata.purpose || metadata.type || null;
}

export default function WalletLedgerTable({ entries, loading, t }) {
  const { fmtDate } = useDateFormat();
  if (loading) {
    return (
      <div className="text-center py-4">
        <Spinner role="status" className="w-4 h-4 text-primary" />

        
      </div>);

  }

  if (entries.length === 0) {
    return (
      <CardEmptyState
        icon="bx-receipt"
        message={t('admin.ledger.noEntries', { defaultValue: 'No ledger entries found' })}
        sub={t('admin.ledger.noEntriesDesc', { defaultValue: 'Try adjusting your filters to see more results' })} />);


  }

  return (
    <Table className="min-w-max">
        <thead>
          <tr className="whitespace-nowrap">
            <th>{t('admin.detail.id', { defaultValue: 'ID' })}</th>
            <th>{t('admin.ledger.type', { defaultValue: 'Type' })}</th>
            <th>{t('admin.detail.coin', { defaultValue: 'Coin' })}</th>
            <th>{t('admin.detail.code', { defaultValue: 'Code' })}</th>
            <th>{t('admin.ledger.state', { defaultValue: 'State' })}</th>
            <th className="text-right">{t('admin.ledger.amount', { defaultValue: 'Amount' })}</th>
            <th className="text-right">USD</th>
            <th>{t('admin.detail.purpose', { defaultValue: 'Purpose' })}</th>
            <th>{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</th>
            <th>{t('admin.ledger.createdAt', { defaultValue: 'Created' })}</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isCredit = entry.entryType === 'credit';
            const metadata = parseMetadata(entry);
            const purposeLabel = getPurposeLabel(metadata);
            const decimals = entry.decimals || 18;
            const amount = entry.amount || AmountNormalizer.fromRawSimple(entry.amountRaw || '0', decimals);

            return (
              <tr key={entry.id}>
                <td>
                  <span className="font-semibold text-primary">{entry.id}</span>
                </td>
                <td>
                  <Badge color={entry.state === 'reversed' ? 'secondary' : isCredit ? 'danger' : 'success'} label>
                    <i className={`bx ${isCredit ? 'bx-minus-circle' : 'bx-plus-circle'} mr-1`}></i>
                    {isCredit ? 'Credit' : 'Debit'}
                  </Badge>
                </td>
                <td className="whitespace-nowrap">
                  <div className="flex items-center">
                    <CoinImg
                      symbol={entry.coinSymbol || metadata?.coin}
                      networkSymbol={entry.networkSymbol || metadata?.network}
                      size={24}
                      className="mr-3" />
                    
                    <div>
                      <div className="font-medium leading-[1.2]">{entry.coinSymbol || metadata?.coin || '-'}</div>
                      {(entry.networkName || metadata?.networkName) &&
                      <small className="text-surface-500 text-xs">{entry.networkName || metadata?.networkName}</small>
                      }
                    </div>
                  </div>
                </td>
                <td>
                  {entry.entryCode ?
                  <span className="font-medium">{entry.entryCode}</span> :

                  <span className="text-surface-500">-</span>
                  }
                </td>
                <td>
                  {entry.state === 'settled' ? <Badge color="success" label>Settled</Badge> :
                  entry.state === 'committed' ? <Badge color="info" label>Committed</Badge> :
                  entry.state === 'pending' ? <Badge color="warning" label>{t('status.pending', { defaultValue: 'Pending' })}</Badge> :
                  entry.state === 'reversed' ? <Badge color="secondary">Reversed</Badge> :
                  <span className="text-surface-500">{entry.state || 'N/A'}</span>}
                </td>
                <td className="text-right whitespace-nowrap">
                  <span className={`font-medium ${isCredit ? 'text-danger' : 'text-success'}`}>
                    {isCredit ? '-' : '+'}{formatAmount(amount)}
                  </span>
                </td>
                <td className="text-right whitespace-nowrap">
                  <span className="text-surface-500">{formatUsd(entry.amountUsd)}</span>
                </td>
                <td>
                  <div>
                    {purposeLabel &&
                    <div className="font-medium text-[0.85rem]">{purposeLabel}</div>
                    }
                    {metadata?.invoiceNumber &&
                    <Badge>{metadata.invoiceNumber}</Badge>
                    }
                    {metadata?.sweepId && !metadata?.invoiceNumber &&
                    <small className="text-surface-500">Sweep #{metadata.sweepId}</small>
                    }
                    {!purposeLabel && !metadata?.invoiceNumber && !metadata?.sweepId &&
                    <span className="text-surface-500">-</span>
                    }
                  </div>
                </td>
                <td>
                  {entry.txHash ?
                  <div className="flex items-center">
                      <span className="mr-2">{entry.txHash}</span>
                      {entry.explorerUrl &&
                    <Button variant="text-secondary" size="icon" className="rounded-full"
                    href={`${entry.explorerUrl}/tx/${entry.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"

                    onClick={(e) => e.stopPropagation()}
                    title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}>
                      
                          <i className="bx bx-link-external text-xl"></i>
                        </Button>
                    }
                    </div> :

                  <span className="text-surface-500">-</span>
                  }
                </td>
                <td>
                  <span className="whitespace-nowrap">{fmtDate(entry.createdAt)}</span>
                </td>
              </tr>);

          })}
        </tbody>
      </Table>);

}