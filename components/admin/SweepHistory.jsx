'use client';

import { useState, useEffect } from 'react';
import { useAdminTranslation } from '@/hooks/useAdminTranslation';
import { useAuth } from '@/app/providers';
import TableEmptyState from '@/components/TableEmptyState';
import { AvatarInitial, Button, Card, Label, Select } from '../ui'

export default function SweepHistory() {
  const { t } = useAdminTranslation();
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  return (
    <div className="grow py-6">
      <div className="grid grid-cols-12 gap-x-6">
        <div className="col-span-12">
          <Card>
            <div className="px-5 py-4 border-b border-surface-200 flex justify-between items-center">
              <div>
                <h5 className="mb-0">{t('admin.sweep.historyTitle', { defaultValue: 'Sweep History' })}</h5>
                <p className="text-muted text-sm mb-0 mt-1">
                  {t('admin.sweep.historyDesc', { defaultValue: 'View all sweep transactions and their status' })}
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline-secondary" size="sm">
                  <i className="bx bx-filter mr-1"></i>
                  {t('actions.filters', { defaultValue: 'Filters' })}
                </Button>
                <Button type="button" variant="outline-primary" size="sm" className="bg-transparent hover:bg-primary-600 hover:text-white">
                  <i className="bx bx-refresh mr-1"></i>
                  {t('actions.refresh', { defaultValue: 'Refresh' })}
                </Button>
              </div>
            </div>
            <div className="p-5">
              {/* Filters */}
              <div className="grid grid-cols-12 gap-x-6 gap-3 mb-4">
                <div className="md:col-span-3">
                  <Label>{t('admin.sweep.coin', { defaultValue: 'Coin' })}</Label>
                  <Select>
                    <option value="">{t('crypto.allCoins', { defaultValue: 'All Coins' })}</option>
                    <option value="BTC">BTC</option>
                    <option value="ETH">ETH</option>
                    <option value="USDT">USDT</option>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Label>{t('admin.sweep.network', { defaultValue: 'Network' })}</Label>
                  <Select>
                    <option value="">{t('crypto.allNetworks', { defaultValue: 'All Networks' })}</option>
                    <option value="Ethereum">Ethereum</option>
                    <option value="BSC">BSC</option>
                    <option value="Polygon">Polygon</option>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Label>{t('admin.sweep.status', { defaultValue: 'Status' })}</Label>
                  <Select>
                    <option value="">{t('invoices.allStatus', { defaultValue: 'All Status' })}</option>
                    <option value="pending">{t('admin.sweep.pending', { defaultValue: 'Pending' })}</option>
                    <option value="completed">{t('admin.sweep.completed', { defaultValue: 'Completed' })}</option>
                    <option value="failed">{t('admin.sweep.failed', { defaultValue: 'Failed' })}</option>
                  </Select>
                </div>
                <div className="md:col-span-3">
                  <Label>{t('admin.sweep.dateRange', { defaultValue: 'Date Range' })}</Label>
                  <Select>
                    <option value="today">{t('admin.sweep.today', { defaultValue: 'Today' })}</option>
                    <option value="week">{t('admin.sweep.thisWeek', { defaultValue: 'This Week' })}</option>
                    <option value="month">{t('admin.sweep.thisMonth', { defaultValue: 'This Month' })}</option>
                  </Select>
                </div>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-12 gap-x-6 gap-3 mb-4">
                <div className="md:col-span-3">
                  <Card className="border shadow-none mb-0">
                    <div className="p-5 p-3">
                      <div className="flex items-center">
                        <div className="avatar shrink-0 mr-3">
                          <AvatarInitial className="bg-primary-50 text-primary-600">
                            <i className="bx bx-check-circle"></i>
                          </AvatarInitial>
                        </div>
                        <div>
                          <small className="text-muted block">{t('admin.sweep.totalSweeps', { defaultValue: 'Total Sweeps' })}</small>
                          <h6 className="mb-0">0</h6>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="md:col-span-3">
                  <Card className="border shadow-none mb-0">
                    <div className="p-5 p-3">
                      <div className="flex items-center">
                        <div className="avatar shrink-0 mr-3">
                          <AvatarInitial className="bg-green-50 text-green-700">
                            <i className="bx bx-check-double"></i>
                          </AvatarInitial>
                        </div>
                        <div>
                          <small className="text-muted block">{t('admin.sweep.completed', { defaultValue: 'Completed' })}</small>
                          <h6 className="mb-0">0</h6>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="md:col-span-3">
                  <Card className="border shadow-none mb-0">
                    <div className="p-5 p-3">
                      <div className="flex items-center">
                        <div className="avatar shrink-0 mr-3">
                          <AvatarInitial className="bg-amber-50 text-amber-700">
                            <i className="bx bx-time"></i>
                          </AvatarInitial>
                        </div>
                        <div>
                          <small className="text-muted block">{t('admin.sweep.pending', { defaultValue: 'Pending' })}</small>
                          <h6 className="mb-0">0</h6>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
                <div className="md:col-span-3">
                  <Card className="border shadow-none mb-0">
                    <div className="p-5 p-3">
                      <div className="flex items-center">
                        <div className="avatar shrink-0 mr-3">
                          <AvatarInitial className="bg-red-50 text-red-700">
                            <i className="bx bx-x-circle"></i>
                          </AvatarInitial>
                        </div>
                        <div>
                          <small className="text-muted block">{t('admin.sweep.failed', { defaultValue: 'Failed' })}</small>
                          <h6 className="mb-0">0</h6>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* History Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th>{t('admin.sweep.date', { defaultValue: 'Date' })}</th>
                      <th>{t('admin.sweep.coin', { defaultValue: 'Coin' })}</th>
                      <th>{t('admin.sweep.network', { defaultValue: 'Network' })}</th>
                      <th>{t('admin.sweep.amount', { defaultValue: 'Amount' })}</th>
                      <th>{t('admin.sweep.from', { defaultValue: 'From' })}</th>
                      <th>{t('admin.sweep.to', { defaultValue: 'To' })}</th>
                      <th>{t('admin.sweep.txHash', { defaultValue: 'Tx Hash' })}</th>
                      <th>{t('admin.sweep.status', { defaultValue: 'Status' })}</th>
                      <th>{t('actions.actions', { defaultValue: 'Actions' })}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <TableEmptyState
                      colSpan={9}
                      icon="bx-history"
                      message={t('admin.sweep.noHistory', { defaultValue: 'No sweep history available' })} />
                    
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex justify-between items-center mt-4">
                <div className="text-muted text-sm">
                  {t('invoices.showingEntries', { start: 0, end: 0, total: 0, defaultValue: 'Showing 0 to 0 of 0 entries' })}
                </div>
                <nav>
                  <ul className="pagination mb-0">
                    <li className="inline-flex disabled">
                      <a className="px-3 py-1.5 text-sm border border-surface-300 text-surface-600 hover:bg-surface-50 rounded" href="#">
                        <i className="bx bx-chevron-left"></i>
                      </a>
                    </li>
                    <li className="inline-flex active">
                      <a className="px-3 py-1.5 text-sm border border-surface-300 text-surface-600 hover:bg-surface-50 rounded" href="#">1</a>
                    </li>
                    <li className="inline-flex disabled">
                      <a className="px-3 py-1.5 text-sm border border-surface-300 text-surface-600 hover:bg-surface-50 rounded" href="#">
                        <i className="bx bx-chevron-right"></i>
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>);

}