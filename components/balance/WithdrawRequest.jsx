'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useTranslation } from 'react-i18next';
import { useAuth } from '@/app/providers';
import { listAllWallets } from '@/lib/api/wallets';
import { getBalancesWithFiat } from '@/lib/api/balance';
import { createWithdrawal, estimateWithdrawalFee } from '@/lib/api/withdrawals';
import Verify2FAModal from '@/components/Verify2FAModal';
import use2FAStatus from '@/hooks/use2FAStatus';
import { AmountNormalizer } from '@/lib/utils/amount_normalizer';
import { formatCoinAmount } from '@/lib/utils/format';
import CoinImg from '@/components/CoinImg';
import WithdrawFeeBreakdown from './WithdrawFeeBreakdown';
import { SuccessModalWrapper, ErrorModalWrapper } from './WithdrawRequestModals';
import { Button, Card, Input, Label, Spinner } from '../ui';


export default function WithdrawRequest() {
  const { t } = useTranslation();
  const { token } = useAuth();
  const router = useRouter();
  const params = useParams();
  const coinNetworkId = params?.coinNetworkId;

  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wallets, setWallets] = useState([]);

  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feeEstimate, setFeeEstimate] = useState(null);
  const [estimatingFee, setEstimatingFee] = useState(false);
  const [feeError, setFeeError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [show2FAModal, setShow2FAModal] = useState(false);

  const { isEnabled: is2FAEnabled, isLoading: is2FALoading } = use2FAStatus();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [balRes, walletList] = await Promise.all([
        getBalancesWithFiat(token, undefined, coinNetworkId),
        listAllWallets(token, 100, coinNetworkId)]
        );
        if (!mounted) return;
        const balanceItem = Array.isArray(balRes?.breakdown) && balRes.breakdown.length > 0 ?
        balRes.breakdown[0] :
        null;
        setBalance(balanceItem);
        setWallets(Array.isArray(walletList) ? walletList : []);
      } catch (e) {
        setError(e?.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    })();
    return () => {mounted = false;};
  }, [token, coinNetworkId]);

  // Tooltips use native title attribute

  const coin = balance?.coin;
  const network = balance?.network;
  const sym = (coin?.symbol || 'COIN').toUpperCase();
  const networkSym = (network?.symbol || '').toUpperCase();
  const networkLabel = network?.name || 'Network';

  const available = useMemo(() => {
    if (!balance) return 0;
    const decimals = Number(balance?.decimals || 8);
    const rawValue = balance?.availableBalanceRaw;
    if (rawValue) {
      return Number(AmountNormalizer.fromRawSimple(rawValue, decimals)) || 0;
    }
    return Number(balance?.availableBalance || 0) || 0;
  }, [balance]);

  const matchingWallets = useMemo(() => {
    const id = Number(coinNetworkId);
    return wallets.filter((w) => Number(w.coinNetworkId) === id);
  }, [wallets, coinNetworkId]);

  // Derive default address from first matching wallet (no useEffect needed)
  const defaultAddress = matchingWallets.length > 0 ? matchingWallets[0]?.address || '' : '';
  const effectiveAddress = address || defaultAddress;

  const selectedWallet = useMemo(() => {
    if (address) return matchingWallets.find((w) => (w.address || '') === address) || null;
    if (effectiveAddress) return matchingWallets.find((w) => (w.address || '') === effectiveAddress) || null;
    return matchingWallets[0] || null;
  }, [matchingWallets, address, effectiveAddress]);

  const decimals = Number(balance?.decimals || 8);

  const executeWithdrawal = async (twoFactorCode) => {
    if (!balance || !effectiveAddress || !effectiveAmount || !selectedWallet?.id || !feeEstimate) return;
    try {
      setSubmitting(true);
      await createWithdrawal({
        coinNetworkId: Number(balance.coinNetworkId),
        amount: String(effectiveAmount),
        withdrawalAddressId: selectedWallet.id,
        memo: '',
        ...(twoFactorCode ? { twoFactorCode } : {})
      }, token);
      setSuccessOpen(true);
    } catch (err) {
      setErrorMessage(typeof err?.message === 'string' ? err.message : 'Withdrawal failed');
      setErrorOpen(true);
    } finally {
      setSubmitting(false);
    }
  };

  const onConfirm = async (e) => {
    e.preventDefault();
    if (!balance || !effectiveAddress || !effectiveAmount || !selectedWallet?.id || !feeEstimate) return;

    if (is2FAEnabled) {
      setShow2FAModal(true);
      return;
    }

    await executeWithdrawal();
  };

  const handle2FASuccess = async (code) => {
    setShow2FAModal(false);
    await executeWithdrawal(code);
  };

  const walletAvailable = useMemo(() => {
    const n = Number(selectedWallet?.availableBalance || selectedWallet?.balance || 0);
    return Number.isFinite(n) ? n : 0;
  }, [selectedWallet]);

  // Derive initial amount from wallet/available balance (no useEffect needed)
  const effectiveAmount = useMemo(() => {
    if (amount !== '' && Number(amount) !== 0) return amount;
    const fill = walletAvailable > 0 ? walletAvailable : available;
    return fill > 0 ? String(fill) : amount;
  }, [amount, walletAvailable, available]);

  const amountNum = Number(effectiveAmount) || 0;
  const canSubmit = amountNum > 0 && amountNum <= available && effectiveAddress.trim().length > 0 && selectedWallet?.id && feeEstimate && !estimatingFee && !is2FALoading;

  useEffect(() => {
    if (!coinNetworkId || !effectiveAmount || Number(effectiveAmount) <= 0) {
      setFeeEstimate(null);
      setFeeError('');
      return;
    }

    let mounted = true;
    const timer = setTimeout(async () => {
      try {
        setEstimatingFee(true);
        setFeeError('');
        const estimate = await estimateWithdrawalFee(coinNetworkId, effectiveAmount, token);
        if (mounted) {
          setFeeEstimate(estimate);
        }
      } catch (e) {
        if (mounted) {
          setFeeEstimate(null);
          const errMsg = e?.error?.message || e?.message || 'Failed to estimate fee';
          setFeeError(errMsg);
        }
      } finally {
        if (mounted) {
          setEstimatingFee(false);
        }
      }
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [effectiveAmount, coinNetworkId, token]);

  const closeSuccess = () => {
    setSuccessOpen(false);
    setTimeout(() => {
      router.push('/withdrawals');
    }, 300);
  };

  const closeError = () => {
    setErrorOpen(false);
    setErrorMessage('');
  };

  return (
    <>
        {loading ?
      <Card><div className="p-6"><div className="animate-pulse space-y-3"><div className="h-4 bg-surface-200 rounded w-1/3"></div><div className="h-4 bg-surface-200 rounded w-2/3"></div></div></div></Card> :
      error ?
      <div className="rounded-lg bg-red-50 text-red-700 p-4" role="alert">{error}</div> :
      !balance ?
      <div className="rounded-lg bg-amber-50 text-amber-700 p-4" role="alert">{t('common.noData') || 'Not found'}</div> :
      !is2FALoading && !is2FAEnabled ?
      <Card className="mx-auto max-w-[520px]">
            <div className="p-6 text-center py-10">
              <div className="mb-4">
                <div className="rounded-full inline-flex items-center justify-center bg-amber-100 w-20 h-20">
                  <i className="bx bx-shield-x text-amber-500 text-[2.5rem]"></i>
                </div>
              </div>
              <h5 className="mb-2 font-semibold text-lg">{t('balance.require2FATitle', { defaultValue: 'Two-Factor Authentication Required' })}</h5>
              <p className="text-surface-500 mb-4">
                {t('balance.require2FADesc', { defaultValue: 'For your security, please enable Two-Factor Authentication (2FA) before making withdrawals.' })}
              </p>
              <Button
            href="/settings">
            
            
                <i className="bx bx-lock mr-2"></i>
                {t('balance.setup2FA', { defaultValue: 'Setup 2FA' })}
              </Button>
            </div>
          </Card> :

      <Card className="mx-auto max-w-[520px]">
            <div className="px-6 py-4 border-b border-surface-200">
              <h5 className="mb-0 font-semibold">{t('balance.requestWithdraw', { defaultValue: 'Request withdraw' })}</h5>
            </div>
            <div className="p-6">
              {wallets.length === 0 || matchingWallets.length === 0 ?
          <div className="text-center py-3">
                  <h6 className="mb-2 font-semibold">{t('wallet.requiredWithdrawTitle', { defaultValue: 'Withdrawal address required' })}</h6>
                  <p className="text-surface-500 mb-3">{t('wallet.requiredWithdrawDesc', { defaultValue: 'To withdraw, please add a withdrawal wallet address first.' })}</p>
                  <Button
              href="/wallet/new-address">
              
              
                    {t('wallet.goCreate', { defaultValue: 'Withdraw wallet' })}
                  </Button>
                </div> :

          <>
                  <div className="mb-3">
                    <div className="text-surface-500 text-sm mb-1">{t('balance.from', { defaultValue: 'From' })}</div>
                    <div className="flex items-center justify-between border rounded-lg p-3">
                      <div className="flex items-center">
                        <CoinImg coin={coin} symbol={sym} networkSymbol={networkSym} size={40} imgClassName="rounded" />
                        <div className="ml-3">
                          <div className="font-semibold">{sym}</div>
                          <div className="text-surface-500 text-sm">{networkLabel}</div>
                        </div>
                      </div>
                      {networkLabel &&
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{t('wallet.colNetwork', { defaultValue: 'Network' })}</span>
                }
                    </div>
                  </div>

                  <div className="mb-3">
                    <Label>{t('balance.payoutAddress', { defaultValue: 'Payout address' })}</Label>
                    <Input value={effectiveAddress} disabled readOnly placeholder={t('wallet.addressPlaceholder', { defaultValue: 'Wallet address' })} />
                  </div>

                  <div className="mb-3">
                    <Label>{t('balance.amount', { defaultValue: 'Amount' })}</Label>
                    <div className="relative">
                      <Input
                  type="number"
                  min="0"
                  max={available}
                  step={1 / Math.pow(10, Math.min(decimals, 8))}

                  value={effectiveAmount}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = Number(value);
                    if (value === '' || numValue >= 0 && numValue <= available) {
                      setAmount(value);
                      setAmountError('');
                    } else if (numValue > available) {
                      setAmountError(t('balance.amountExceedsBalance', { defaultValue: 'Amount exceeds available balance' }));
                    }
                  }}
                  placeholder="0.0" className="text-lg pr-[80px]" />

                
                      <button
                  type="button"
                  className="absolute top-1/2 right-2 -translate-y-1/2 text-primary-600 hover:text-primary-700 text-sm font-medium"
                  onClick={() => setAmount(String(available))}>
                  
                        {t('balance.max', { defaultValue: 'Max' })}
                      </button>
                    </div>
                    <div className="text-surface-500 text-sm mt-2">
                      {t('balance.balance', { defaultValue: 'Balance' })}: {formatCoinAmount(available)} {sym}
                    </div>
                    {amountError &&
              <div className="text-red-500 text-sm mt-1">
                        <i className="bx bx-error-circle mr-1"></i>
                        {amountError}
                      </div>
              }
                  </div>

                  <WithdrawFeeBreakdown feeEstimate={feeEstimate} sym={sym} t={t} />

                  {estimatingFee && !feeEstimate &&
            <div className="mb-3 text-center">
                      <Spinner role="status" aria-hidden="true" className="w-4 h-4 mr-2 inline-block align-middle" />
                      <span className="text-sm text-surface-500">{t('balance.calculatingFee', { defaultValue: 'Calculating fee...' })}</span>
                    </div>
            }

                  {feeError && !estimatingFee &&
            <div className="mb-3">
                      <div className="rounded-lg bg-red-50 text-red-700 py-2 px-3" role="alert">
                        <i className="bx bx-error-circle mr-1"></i>
                        <span className="text-sm">{feeError}</span>
                      </div>
                    </div>
            }
                </>
          }
            </div>
            {wallets.length > 0 && matchingWallets.length > 0 && !successOpen &&
        <div className="px-6 py-4 border-t border-surface-200">
                <Button onClick={onConfirm} disabled={!canSubmit || submitting} className="w-full">
                  {submitting ? <Spinner role="status" aria-hidden="true" className="w-4 h-4 mr-2 inline-block align-middle" /> : null}
                  {t('actions.confirm', { defaultValue: 'Confirm' })}
                </Button>
              </div>
        }
          </Card>
      }
      <SuccessModalWrapper open={successOpen} onClose={closeSuccess} receiveAmount={feeEstimate?.display?.netAmount || effectiveAmount} sym={sym} address={effectiveAddress} networkName={networkLabel} t={t} />
      <ErrorModalWrapper open={errorOpen} onClose={closeError} message={errorMessage} t={t} />

      <Verify2FAModal
        show={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        onSuccess={handle2FASuccess}
        title={t('balance.confirm2FATitle', { defaultValue: 'Confirm Withdrawal' })}
        description={t('balance.confirm2FADescription', { defaultValue: 'Enter your 2FA code to confirm this withdrawal' })}
        skipVerify={true} />
      
    </>);

}