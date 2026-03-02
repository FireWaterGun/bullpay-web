#!/usr/bin/env python3
"""
Batch translate hardcoded English strings in admin pages/components.
Replaces common patterns with t() calls using existing locale keys.
"""

import re
import os
import glob

WEB_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ─── Common patterns to replace ───────────────────────────────────────────────
# Each entry: (regex_pattern, replacement, description)
# These patterns handle JSX text content and attribute values.

# Simple text-in-JSX replacements: >Text< → >{t('key', { defaultValue: 'Text' })}<
# We match the text between > and < with surrounding context.

# For attribute replacements: title="Text" → title={t('key', { defaultValue: 'Text' })}
# placeholder="Text" → placeholder={t('key', { defaultValue: 'Text' })}

ATTR_REPLACEMENTS = [
    # title attributes - common across many files
    ('title="Copy address"', "title={t('admin.detail.copyAddress', { defaultValue: 'Copy address' })}"),
    ('title="Copy tx hash"', "title={t('admin.detail.copyTxHash', { defaultValue: 'Copy tx hash' })}"),
    ('title="Copy email"', "title={t('admin.detail.copyEmail', { defaultValue: 'Copy email' })}"),
    ('title="View detail"', "title={t('admin.detail.viewDetail', { defaultValue: 'View detail' })}"),
    ('title="View details"', "title={t('admin.detail.viewDetails', { defaultValue: 'View details' })}"),
    ('title="View on explorer"', "title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}"),
    ('title="View on Explorer"', "title={t('admin.detail.viewOnExplorer', { defaultValue: 'View on explorer' })}"),
    ('title="Expand all"', "title={t('admin.roles.expandAll', { defaultValue: 'Expand all' })}"),
    ('title="Collapse all"', "title={t('admin.roles.collapseAll', { defaultValue: 'Collapse all' })}"),
    ('title="Retry sweep"', "title={t('admin.sweepDetail.retrySweep', { defaultValue: 'Retry sweep' })}"),

    # placeholder attributes
    ('placeholder="Search permissions..."', "placeholder={t('admin.roles.searchPermissions', { defaultValue: 'Search permissions...' })}"),
    ('placeholder="Search..."', "placeholder={t('actions.search', { defaultValue: 'Search...' })}"),
    ('placeholder="Search users..."', "placeholder={t('admin.users.searchPlaceholder', { defaultValue: 'Search users...' })}"),
    ('placeholder="Search by address..."', "placeholder={t('admin.detail.searchByAddress', { defaultValue: 'Search by address...' })}"),
    ('placeholder="Search by email..."', "placeholder={t('admin.detail.searchByEmail', { defaultValue: 'Search by email...' })}"),
    ('placeholder="Select date range"', "placeholder={t('admin.detail.selectDateRange', { defaultValue: 'Select date range' })}"),
]

# Text content replacements in JSX: between > and <
# Format: (exact_text, t_key, default_value)
# These will match >TEXT< patterns
JSX_TEXT_REPLACEMENTS = [
    # Common action buttons
    ('>Apply Filters<', ">{t('actions.applyFilters', { defaultValue: 'Apply Filters' })}<"),
    ('>Reset</', ">{t('actions.reset', { defaultValue: 'Reset' })}</"  ),
    ('>Cancel</', ">{t('actions.cancel', { defaultValue: 'Cancel' })}</"),
    ('>Delete</', ">{t('actions.delete', { defaultValue: 'Delete' })}</"),
    ('>Save</', ">{t('actions.save', { defaultValue: 'Save' })}</"),
    ('>Close</', ">{t('actions.close', { defaultValue: 'Close' })}</"),
    ('>Confirm</', ">{t('admin.detail.confirm', { defaultValue: 'Confirm' })}</"),
    ('>Previous</', ">{t('actions.prev', { defaultValue: 'Previous' })}</"),
    ('>Next</', ">{t('actions.next', { defaultValue: 'Next' })}</"),
    ('>Edit</', ">{t('actions.edit', { defaultValue: 'Edit' })}</"),
    ('>Update</', ">{t('actions.update', { defaultValue: 'Update' })}</"),
    ('>Create</', ">{t('actions.add', { defaultValue: 'Create' })}</"),
    ('>Save Changes<', ">{t('actions.save', { defaultValue: 'Save Changes' })}<"),
    ('>Saving...<', ">{t('actions.saving', { defaultValue: 'Saving...' })}<"),
    ('>Confirm Delete<', ">{t('admin.detail.confirmDelete', { defaultValue: 'Confirm Delete' })}<"),

    # Common table headers
    ('>ID</', ">{t('admin.detail.id', { defaultValue: 'ID' })}</"),
    ('>Status</', ">{t('admin.detail.status', { defaultValue: 'Status' })}</"),
    ('>Created</', ">{t('admin.detail.created', { defaultValue: 'Created' })}</"),
    ('>Updated</', ">{t('admin.detail.updated', { defaultValue: 'Updated' })}</"),
    ('>Amount</', ">{t('admin.detail.amount', { defaultValue: 'Amount' })}</"),
    ('>Type</', ">{t('admin.detail.type', { defaultValue: 'Type' })}</"),
    ('>Direction</', ">{t('admin.detail.direction', { defaultValue: 'Direction' })}</"),
    ('>State</', ">{t('admin.detail.state', { defaultValue: 'State' })}</"),
    ('>Coin</', ">{t('admin.detail.coin', { defaultValue: 'Coin' })}</"),
    ('>Network</', ">{t('admin.detail.network', { defaultValue: 'Network' })}</"),
    ('>Symbol</', ">{t('admin.detail.symbol', { defaultValue: 'Symbol' })}</"),
    ('>Email</', ">{t('admin.detail.email', { defaultValue: 'Email' })}</"),
    ('>Role</', ">{t('admin.detail.role', { defaultValue: 'Role' })}</"),
    ('>Action</', ">{t('admin.detail.action', { defaultValue: 'Action' })}</"),
    ('>Actions</', ">{t('admin.detail.actions', { defaultValue: 'Actions' })}</"),
    ('>Chain</', ">{t('admin.detail.chain', { defaultValue: 'Chain' })}</"),
    ('>Address</', ">{t('admin.detail.address', { defaultValue: 'Address' })}</"),
    ('>Tx Hash</', ">{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</"),
    ('>From Address</', ">{t('admin.detail.fromAddress', { defaultValue: 'From Address' })}</"),
    ('>To Address</', ">{t('admin.detail.toAddress', { defaultValue: 'To Address' })}</"),
    ('>Block Number</', ">{t('admin.detail.blockNumber', { defaultValue: 'Block Number' })}</"),
    ('>Confirmations</', ">{t('admin.detail.confirmations', { defaultValue: 'Confirmations' })}</"),
    ('>Coin / Network</', ">{t('admin.detail.coinNetwork', { defaultValue: 'Coin / Network' })}</"),
    ('>Coin Network ID</', ">{t('admin.detail.coinNetworkId', { defaultValue: 'Coin Network ID' })}</"),
    ('>User ID</', ">{t('admin.detail.userId', { defaultValue: 'User ID' })}</"),
    ('>Wallet ID</', ">{t('admin.detail.walletId', { defaultValue: 'Wallet ID' })}</"),
    ('>Reference</', ">{t('admin.detail.reference', { defaultValue: 'Reference' })}</"),
    ('>Related ID</', ">{t('admin.detail.relatedId', { defaultValue: 'Related ID' })}</"),
    ('>Purpose</', ">{t('admin.detail.purpose', { defaultValue: 'Purpose' })}</"),
    ('>Reservation ID</', ">{t('admin.detail.reservationId', { defaultValue: 'Reservation ID' })}</"),
    ('>Balance After</', ">{t('admin.detail.balanceAfter', { defaultValue: 'Balance After' })}</"),
    ('>Amount (USD)</', ">{t('admin.detail.amountUsd', { defaultValue: 'Amount (USD)' })}</"),
    ('>Failure Reason</', ">{t('admin.detail.failureReason', { defaultValue: 'Failure Reason' })}</"),
    ('>Details</', ">{t('admin.detail.details', { defaultValue: 'Details' })}</"),
    ('>Transaction</', ">{t('admin.detail.transaction', { defaultValue: 'Transaction' })}</"),
    ('>Metadata</', ">{t('admin.detail.metadata', { defaultValue: 'Metadata' })}</"),
    ('>Timestamps</', ">{t('admin.detail.timestamps', { defaultValue: 'Timestamps' })}</"),
    ('>Credit</', ">{t('admin.detail.credit', { defaultValue: 'Credit' })}</"),
    ('>Debit</', ">{t('admin.detail.debit', { defaultValue: 'Debit' })}</"),

    # Common section headings
    ('>All Status<', ">{t('admin.detail.allStatus', { defaultValue: 'All Status' })}<"),
    ('>All Roles<', ">{t('admin.detail.allRoles', { defaultValue: 'All Roles' })}<"),

    # Common labels
    ('>Reason</', ">{t('admin.detail.reason', { defaultValue: 'Reason' })}</"),
    ('>Date</', ">{t('admin.detail.date', { defaultValue: 'Date' })}</"),
    ('>Admin</', ">{t('admin.detail.admin', { defaultValue: 'Admin' })}</"),
    ('>Event</', ">{t('admin.detail.event', { defaultValue: 'Event' })}</"),
    ('>Code</', ">{t('admin.detail.code', { defaultValue: 'Code' })}</"),
    ('>Callback URL</', ">{t('admin.detail.callbackUrl', { defaultValue: 'Callback URL' })}</"),
    ('>Error</', ">{t('admin.detail.error', { defaultValue: 'Error' })}</"),
    ('>Resource Type</', ">{t('admin.auditLog.resourceType', { defaultValue: 'Resource Type' })}</"),
    ('>Value (USD)</', ">{t('admin.userBalance.valueUsd', { defaultValue: 'Value (USD)' })}</"),
    ('>Assets</', ">{t('admin.userBalance.assets', { defaultValue: 'Assets' })}</"),

    # Status option text (inside <option>)
    ('>Pending</', ">{t('status.pending', { defaultValue: 'Pending' })}</"),
    ('>Processing</', ">{t('status.processing', { defaultValue: 'Processing' })}</"),
    ('>Completed</', ">{t('status.completed', { defaultValue: 'Completed' })}</"),
    ('>Failed</', ">{t('status.failed', { defaultValue: 'Failed' })}</"),
    ('>Cancelled</', ">{t('status.cancelled', { defaultValue: 'Cancelled' })}</"),
    ('>Expired</', ">{t('status.expired', { defaultValue: 'Expired' })}</"),
    ('>Confirmed</', ">{t('status.confirmed', { defaultValue: 'Confirmed' })}</"),
    ('>Detecting</', ">{t('status.detecting', { defaultValue: 'Detecting' })}</"),
    ('>Confirming</', ">{t('status.confirming', { defaultValue: 'Confirming' })}</"),
    ('>Unconfirmed</', ">{t('status.unconfirmed', { defaultValue: 'Unconfirmed' })}</"),
    ('>Active</', ">{t('admin.detail.active', { defaultValue: 'Active' })}</"),
    ('>Inactive</', ">{t('admin.detail.inactive', { defaultValue: 'Inactive' })}</"),
    ('>Maintenance</', ">{t('admin.detail.maintenance', { defaultValue: 'Maintenance' })}</"),
    ('>Native</', ">{t('admin.detail.native', { defaultValue: 'Native' })}</"),
    ('>Token</', ">{t('admin.detail.token', { defaultValue: 'Token' })}</"),
    ('>Success</', ">{t('admin.detail.success', { defaultValue: 'Success' })}</"),

    # Sort order options
    ("'Ascending'", "t('admin.detail.ascending', { defaultValue: 'Ascending' })"),
    ("'Descending'", "t('admin.detail.descending', { defaultValue: 'Descending' })"),

    # Common toast patterns (without file context)
    ("toast.success('Copied!')", "toast.success(t('actions.copied', { defaultValue: 'Copied!' }))"),
    ("toast.success('Copied to clipboard!')", "toast.success(t('actions.copied', { defaultValue: 'Copied to clipboard!' }))"),
    ("toast.error('Failed to copy')", "toast.error(t('actions.copyFailed', { defaultValue: 'Failed to copy' }))"),
]

# Button text after icons: <i className="..."></i>Text
ICON_TEXT_REPLACEMENTS = [
    ('</i>Explorer</', "</i>{t('admin.detail.explorer', { defaultValue: 'Explorer' })}</"),
    ('</i>Copy</', "</i>{t('admin.detail.copy', { defaultValue: 'Copy' })}</"),
    # Don't replace Copy when it's inside a different context
]

# toast.error/toast.success patterns
TOAST_REPLACEMENTS = [
    ("toast.error('Failed to load')", "toast.error(t('admin.detail.loadError', { defaultValue: 'Failed to load' }))"),
    ("toast.error('Failed to copy')", "toast.error(t('actions.copyFailed', { defaultValue: 'Failed to copy' }))"),
]

# ─── File-specific replacements ────────────────────────────────────────────────
# Maps file path patterns to their specific replacements

FILE_SPECIFIC = {
    # ── Temp Wallets List ──
    'temp-wallets/page.jsx': [
        ('>Temp Wallets<', ">{t('admin.tempWallet.title', { defaultValue: 'Temp Wallets' })}<"),
        ('>No temp wallets found<', ">{t('admin.tempWallet.noWallets', { defaultValue: 'No temp wallets found' })}<"),
        ("toast.error('Failed to load temp wallets')", "toast.error(t('admin.tempWallet.loadError', { defaultValue: 'Failed to load temp wallets' }))"),
        ('>All Status<', ">{t('admin.detail.allStatus', { defaultValue: 'All Status' })}<"),
        ("'Created At'", "t('admin.detail.createdAt', { defaultValue: 'Created At' })"),
        ("'Last Assigned'", "t('admin.tempWallet.lastAssigned', { defaultValue: 'Last Assigned' })"),
        ("'Last Sweep'", "t('admin.tempWallet.lastSweep', { defaultValue: 'Last Sweep' })"),
        ("'Reuse Count'", "t('admin.tempWallet.reuseCount', { defaultValue: 'Reuse Count' })"),
        ("'Ascending'", "t('admin.detail.ascending', { defaultValue: 'Ascending' })"),
        ("'Descending'", "t('admin.detail.descending', { defaultValue: 'Descending' })"),
        ('>Address</', ">{t('admin.detail.address', { defaultValue: 'Address' })}</"),
        ('>Coin / Network</', ">{t('admin.detail.coinNetwork', { defaultValue: 'Coin / Network' })}</"),
        ('>Status</', ">{t('admin.detail.status', { defaultValue: 'Status' })}</"),
        ('>Reuse Count</', ">{t('admin.tempWallet.reuseCount', { defaultValue: 'Reuse Count' })}</"),
        ('>Last Assigned</', ">{t('admin.tempWallet.lastAssigned', { defaultValue: 'Last Assigned' })}</"),
        ('>Created</', ">{t('admin.detail.created', { defaultValue: 'Created' })}</"),
        ('>Manage and monitor temporary wallets<', ">{t('admin.tempWallet.description', { defaultValue: 'Manage and monitor temporary wallets' })}<"),
    ],
    # ── User Balances List ──
    'user-balances/page.jsx': [
        ('>User Balances<', ">{t('admin.userBalance.title', { defaultValue: 'User Balances' })}<"),
        ('>No user balances found<', ">{t('admin.userBalance.noBalances', { defaultValue: 'No user balances found' })}<"),
        ("toast.error('Failed to load user balances')", "toast.error(t('admin.userBalance.loadError', { defaultValue: 'Failed to load user balances' }))"),
        ("toast.error('Failed to load summary')", "toast.error(t('admin.userBalance.summaryError', { defaultValue: 'Failed to load summary' }))"),
        ("'Total Value (USD)'", "t('admin.userBalance.totalValueUsd', { defaultValue: 'Total Value (USD)' })"),
        ("'Total Assets'", "t('admin.userBalance.totalAssets', { defaultValue: 'Total Assets' })"),
        ("'Updated At'", "t('admin.detail.updatedAt', { defaultValue: 'Updated At' })"),
        ('>Total Users<', ">{t('admin.userBalance.totalUsers', { defaultValue: 'Total Users' })}<"),
        ('>Total Value (USD)<', ">{t('admin.userBalance.totalValueUsd', { defaultValue: 'Total Value (USD)' })}<"),
        ('>With Balance<', ">{t('admin.userBalance.withBalance', { defaultValue: 'With Balance' })}<"),
        ('>View user wallet balances and asset overview<', ">{t('admin.userBalance.description', { defaultValue: 'View user wallet balances and asset overview' })}<"),
        ('>Email</', ">{t('admin.detail.email', { defaultValue: 'Email' })}</"),
        ('>Role</', ">{t('admin.detail.role', { defaultValue: 'Role' })}</"),
        ('>Assets</', ">{t('admin.userBalance.assets', { defaultValue: 'Assets' })}</"),
        ('>Value (USD)</', ">{t('admin.userBalance.valueUsd', { defaultValue: 'Value (USD)' })}</"),
        ('>Updated</', ">{t('admin.detail.updated', { defaultValue: 'Updated' })}</"),
    ],
    # ── Platform Ledger Detail ──
    'platform-ledger/[id]/page.jsx': [
        ('>Back to Platform Ledger<', ">{t('admin.platformLedgerDetail.backToList', { defaultValue: 'Back to Platform Ledger' })}<"),
        ('>Details</', ">{t('admin.detail.details', { defaultValue: 'Details' })}</"),
        ('>Transaction</', ">{t('admin.detail.transaction', { defaultValue: 'Transaction' })}</"),
        ('>Metadata</', ">{t('admin.detail.metadata', { defaultValue: 'Metadata' })}</"),
        ('>Timestamps</', ">{t('admin.detail.timestamps', { defaultValue: 'Timestamps' })}</"),
        ('>Entry not found<', ">{t('admin.platformLedgerDetail.notFound', { defaultValue: 'Entry not found' })}<"),
        ("toast.success('Copied!')", "toast.success(t('actions.copied', { defaultValue: 'Copied!' }))"),
        ("toast.error('Failed to copy')", "toast.error(t('actions.copyFailed', { defaultValue: 'Failed to copy' }))"),
        ('>ID</', ">{t('admin.detail.id', { defaultValue: 'ID' })}</"),
        ('>Type</', ">{t('admin.detail.type', { defaultValue: 'Type' })}</"),
        ('>Direction</', ">{t('admin.detail.direction', { defaultValue: 'Direction' })}</"),
        ('>Amount</', ">{t('admin.detail.amount', { defaultValue: 'Amount' })}</"),
        ('>Amount (USD)</', ">{t('admin.detail.amountUsd', { defaultValue: 'Amount (USD)' })}</"),
        ('>Balance After</', ">{t('admin.detail.balanceAfter', { defaultValue: 'Balance After' })}</"),
        ('>Coin Network ID</', ">{t('admin.detail.coinNetworkId', { defaultValue: 'Coin Network ID' })}</"),
        ('>State</', ">{t('admin.detail.state', { defaultValue: 'State' })}</"),
        ('>Reference</', ">{t('admin.detail.reference', { defaultValue: 'Reference' })}</"),
        ('>Related ID</', ">{t('admin.detail.relatedId', { defaultValue: 'Related ID' })}</"),
        ('>Purpose</', ">{t('admin.detail.purpose', { defaultValue: 'Purpose' })}</"),
        ('>Wallet ID</', ">{t('admin.detail.walletId', { defaultValue: 'Wallet ID' })}</"),
        ('>Created</', ">{t('admin.detail.created', { defaultValue: 'Created' })}</"),
        ('>Updated</', ">{t('admin.detail.updated', { defaultValue: 'Updated' })}</"),
        ('>Credit</', ">{t('admin.detail.credit', { defaultValue: 'Credit' })}</"),
        ('>Debit</', ">{t('admin.detail.debit', { defaultValue: 'Debit' })}</"),
        ('>Tx Hash</', ">{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</"),
        ('>Block Number</', ">{t('admin.detail.blockNumber', { defaultValue: 'Block Number' })}</"),
        ('>From Address</', ">{t('admin.detail.fromAddress', { defaultValue: 'From Address' })}</"),
        ('>To Address</', ">{t('admin.detail.toAddress', { defaultValue: 'To Address' })}</"),
        ('>Failure Reason</', ">{t('admin.detail.failureReason', { defaultValue: 'Failure Reason' })}</"),
        ('>Reservation ID</', ">{t('admin.detail.reservationId', { defaultValue: 'Reservation ID' })}</"),
    ],
    # ── Platform Ledger List ──
    'platform-ledger/page.jsx': [
        ('>View all revenue and expense entries<', ">{t('admin.platformLedger.description', { defaultValue: 'View all revenue and expense entries' })}<"),
    ],
    # ── User Ledger Detail ──
    'user-ledger/[id]/page.jsx': [
        ('>Back to User Ledger<', ">{t('admin.userLedgerDetail.backToList', { defaultValue: 'Back to User Ledger' })}<"),
        ('>Details</', ">{t('admin.detail.details', { defaultValue: 'Details' })}</"),
        ('>Transaction</', ">{t('admin.detail.transaction', { defaultValue: 'Transaction' })}</"),
        ('>Metadata</', ">{t('admin.detail.metadata', { defaultValue: 'Metadata' })}</"),
        ('>Timestamps</', ">{t('admin.detail.timestamps', { defaultValue: 'Timestamps' })}</"),
        ('>Entry not found<', ">{t('admin.userLedgerDetail.notFound', { defaultValue: 'Entry not found' })}<"),
        ("toast.success('Copied!')", "toast.success(t('actions.copied', { defaultValue: 'Copied!' }))"),
        ("toast.error('Failed to copy')", "toast.error(t('actions.copyFailed', { defaultValue: 'Failed to copy' }))"),
        ('>ID</', ">{t('admin.detail.id', { defaultValue: 'ID' })}</"),
        ('>Type</', ">{t('admin.detail.type', { defaultValue: 'Type' })}</"),
        ('>Direction</', ">{t('admin.detail.direction', { defaultValue: 'Direction' })}</"),
        ('>Amount</', ">{t('admin.detail.amount', { defaultValue: 'Amount' })}</"),
        ('>Amount (USD)</', ">{t('admin.detail.amountUsd', { defaultValue: 'Amount (USD)' })}</"),
        ('>Balance After</', ">{t('admin.detail.balanceAfter', { defaultValue: 'Balance After' })}</"),
        ('>Coin Network ID</', ">{t('admin.detail.coinNetworkId', { defaultValue: 'Coin Network ID' })}</"),
        ('>State</', ">{t('admin.detail.state', { defaultValue: 'State' })}</"),
        ('>Reference</', ">{t('admin.detail.reference', { defaultValue: 'Reference' })}</"),
        ('>Related ID</', ">{t('admin.detail.relatedId', { defaultValue: 'Related ID' })}</"),
        ('>User ID</', ">{t('admin.detail.userId', { defaultValue: 'User ID' })}</"),
        ('>Created</', ">{t('admin.detail.created', { defaultValue: 'Created' })}</"),
        ('>Updated</', ">{t('admin.detail.updated', { defaultValue: 'Updated' })}</"),
        ('>Credit</', ">{t('admin.detail.credit', { defaultValue: 'Credit' })}</"),
        ('>Debit</', ">{t('admin.detail.debit', { defaultValue: 'Debit' })}</"),
        ('>Tx Hash</', ">{t('admin.detail.txHash', { defaultValue: 'Tx Hash' })}</"),
        ('>Block Number</', ">{t('admin.detail.blockNumber', { defaultValue: 'Block Number' })}</"),
        ('>From Address</', ">{t('admin.detail.fromAddress', { defaultValue: 'From Address' })}</"),
        ('>To Address</', ">{t('admin.detail.toAddress', { defaultValue: 'To Address' })}</"),
    ],
    # ── User Ledger List ──
    'user-ledger/page.jsx': [
        ('>View all user ledger entries<', ">{t('admin.userLedgerDetail.listDescription', { defaultValue: 'View all user ledger entries' })}<"),
        ('>No ledger entries found<', ">{t('admin.userLedgerDetail.noEntries', { defaultValue: 'No ledger entries found' })}<"),
    ],
    # ── System Ledger Detail ──
    'system-ledger/[id]/page.jsx': [
        ('>Back to System Ledger<', ">{t('admin.walletLedger.backToList', { defaultValue: 'Back to System Ledger' })}<"),
        ('>Details</', ">{t('admin.detail.details', { defaultValue: 'Details' })}</"),
        ('>Transaction</', ">{t('admin.detail.transaction', { defaultValue: 'Transaction' })}</"),
        ('>Metadata</', ">{t('admin.detail.metadata', { defaultValue: 'Metadata' })}</"),
        ('>Timestamps</', ">{t('admin.detail.timestamps', { defaultValue: 'Timestamps' })}</"),
        ('>Entry not found<', ">{t('admin.walletLedger.notFound', { defaultValue: 'Entry not found' })}<"),
        ('>Credit</', ">{t('admin.detail.credit', { defaultValue: 'Credit' })}</"),
        ('>Debit</', ">{t('admin.detail.debit', { defaultValue: 'Debit' })}</"),
    ],
    # ── System Ledger List ──
    'system-ledger/page.jsx': [
        ('>View all system ledger entries<', ">{t('admin.walletLedger.listDescription', { defaultValue: 'View all system ledger entries' })}<"),
    ],
    # ── Sweeps List ──
    'sweeps/page.jsx': [
        ('>View all sweep transactions<', ">{t('admin.sweep.description', { defaultValue: 'View all sweep transactions' })}<"),
        ('>No sweeps found<', ">{t('admin.sweep.noSweeps', { defaultValue: 'No sweeps found' })}<"),
        ("toast.error('Failed to load sweeps')", "toast.error(t('admin.sweep.loadError', { defaultValue: 'Failed to load sweeps' }))"),
    ],
    # ── Sweeps Detail ──
    'sweeps/[id]/page.jsx': [
        ('>Back to Sweeps<', ">{t('admin.sweepDetail.backToList', { defaultValue: 'Back to Sweeps' })}<"),
        ('>Sweep not found<', ">{t('admin.sweepDetail.notFound', { defaultValue: 'Sweep not found' })}<"),
        ('>Details</', ">{t('admin.detail.details', { defaultValue: 'Details' })}</"),
        ('>Failure Reason</', ">{t('admin.detail.failureReason', { defaultValue: 'Failure Reason' })}</"),
        ("toast.error('Failed to load sweep')", "toast.error(t('admin.sweepDetail.loadError', { defaultValue: 'Failed to load sweep' }))"),
        ("toast.error('Failed to load sweep transaction')", "toast.error(t('admin.sweepDetail.loadError', { defaultValue: 'Failed to load sweep transaction' }))"),
    ],
    # ── Withdrawals List ──
    'withdrawals/page.jsx': [
        ('>View and manage withdrawal requests<', ">{t('admin.withdrawal.description', { defaultValue: 'View and manage withdrawal requests' })}<"),
        ('>No withdrawals found<', ">{t('admin.withdrawal.noWithdrawals', { defaultValue: 'No withdrawals found' })}<"),
        ("toast.error('Failed to load withdrawals')", "toast.error(t('admin.withdrawal.loadError', { defaultValue: 'Failed to load withdrawals' }))"),
        ("toast.success('Withdrawal approved')", "toast.success(t('admin.withdrawal.approveSuccess', { defaultValue: 'Withdrawal approved' }))"),
        ("'Please provide a reason'", "t('admin.withdrawal.provideReason', { defaultValue: 'Please provide a reason' })"),
    ],
    # ── Payments List ──
    'payments/page.jsx': [
        ('>View all blockchain payment transactions<', ">{t('admin.paymentDetail.listDescription', { defaultValue: 'View all blockchain payment transactions' })}<"),
        ('>No payments found<', ">{t('admin.paymentDetail.noPayments', { defaultValue: 'No payments found' })}<"),
        ("toast.error('Failed to load payments')", "toast.error(t('admin.paymentDetail.loadError', { defaultValue: 'Failed to load payments' }))"),
    ],
    # ── Payments Detail ──
    'payments/[id]/page.jsx': [
        ('>Back to Payments<', ">{t('admin.paymentDetail.backToList', { defaultValue: 'Back to Payments' })}<"),
        ('>Payment not found<', ">{t('admin.paymentDetail.notFound', { defaultValue: 'Payment not found' })}<"),
        ("toast.error('Failed to load payment')", "toast.error(t('admin.paymentDetail.loadError', { defaultValue: 'Failed to load payment' }))"),
        ("toast.success('Copied!')", "toast.success(t('actions.copied', { defaultValue: 'Copied!' }))"),
        ("toast.error('Failed to copy')", "toast.error(t('actions.copyFailed', { defaultValue: 'Failed to copy' }))"),
    ],
    # ── Invoices Detail ──
    'invoices/[id]/page.jsx': [
        ('>Back to Invoices<', ">{t('admin.invoiceDetail.backToList', { defaultValue: 'Back to Invoices' })}<"),
        ('>Invoice not found<', ">{t('admin.invoiceDetail.notFound', { defaultValue: 'Invoice not found' })}<"),
        ("toast.error('Failed to load invoice')", "toast.error(t('admin.invoiceDetail.loadError', { defaultValue: 'Failed to load invoice' }))"),
        ("toast.success('Copied!')", "toast.success(t('actions.copied', { defaultValue: 'Copied!' }))"),
        ("toast.error('Failed to copy')", "toast.error(t('actions.copyFailed', { defaultValue: 'Failed to copy' }))"),
    ],
    # ── Audit Logs List ──
    'audit-logs/page.jsx': [
        ("toast.error('Failed to load audit logs')", "toast.error(t('admin.auditLog.loadError', { defaultValue: 'Failed to load audit logs' }))"),
        ('>No audit logs found<', ">{t('admin.auditLog.noLogs', { defaultValue: 'No audit logs found' })}<"),
    ],
    # ── Audit Logs Detail ──
    'audit-logs/[id]/page.jsx': [
        ('>Back to Audit Logs<', ">{t('admin.auditLog.backToList', { defaultValue: 'Back to Audit Logs' })}<"),
        ('>Audit log not found<', ">{t('admin.auditLog.notFound', { defaultValue: 'Audit log not found' })}<"),
        ("toast.error('Failed to load audit log')", "toast.error(t('admin.auditLog.loadError', { defaultValue: 'Failed to load audit log' }))"),
    ],
    # ── Webhook Logs Detail ──
    'merchant-webhook-logs/[id]/page.jsx': [
        ('>Back to Webhook Logs<', ">{t('admin.webhookLog.backToList', { defaultValue: 'Back to Webhook Logs' })}<"),
        ('>Webhook log not found<', ">{t('admin.webhookLog.notFound', { defaultValue: 'Webhook log not found' })}<"),
        ("toast.error('Failed to load webhook log')", "toast.error(t('admin.webhookLog.loadError', { defaultValue: 'Failed to load webhook log' }))"),
        ("toast.success('Webhook retry initiated')", "toast.success(t('admin.webhookLog.retrySuccess', { defaultValue: 'Webhook retry initiated' }))"),
        ("toast.error('Failed to retry webhook')", "toast.error(t('admin.webhookLog.retryError', { defaultValue: 'Failed to retry webhook' }))"),
        ('>Retry Webhook<', ">{t('admin.webhookLog.retryWebhook', { defaultValue: 'Retry Webhook' })}<"),
        ('>Retrying...<', ">{t('admin.webhookLog.retrying', { defaultValue: 'Retrying...' })}<"),
        ('>Request Payload<', ">{t('admin.webhookLog.requestPayload', { defaultValue: 'Request Payload' })}<"),
        ('>Response Body<', ">{t('admin.webhookLog.responseBody', { defaultValue: 'Response Body' })}<"),
    ],
    # ── Coins List ──
    'coins/page.jsx': [
        ('>No coins found<', ">{t('admin.detail.noCoins', { defaultValue: 'No coins found' })}<"),
        ("toast.error('Failed to load coins')", "toast.error(t('admin.detail.loadCoinsError', { defaultValue: 'Failed to load coins' }))"),
    ],
    # ── Networks List ──
    'networks/page.jsx': [
        ('>No networks found<', ">{t('admin.detail.noNetworks', { defaultValue: 'No networks found' })}<"),
        ("toast.error('Failed to load networks')", "toast.error(t('admin.detail.loadNetworksError', { defaultValue: 'Failed to load networks' }))"),
    ],
    # ── Coin Networks List ──
    'coin-networks/page.jsx': [
        ("toast.error('Failed to load coin networks')", "toast.error(t('admin.detail.loadCoinNetworksError', { defaultValue: 'Failed to load coin networks' }))"),
        ("toast.success('Copied!')", "toast.success(t('actions.copied', { defaultValue: 'Copied!' }))"),
    ],
    # ── Users List ──
    'users/page.jsx': [
        ('>User Management<', ">{t('admin.users.title', { defaultValue: 'User Management' })}<"),
        ('>Manage user accounts, roles, and access<', ">{t('admin.users.description', { defaultValue: 'Manage user accounts, roles, and access' })}<"),
        ('>No users found<', ">{t('admin.users.noUsers', { defaultValue: 'No users found' })}<"),
        ("toast.error('Failed to load users')", "toast.error(t('admin.users.loadError', { defaultValue: 'Failed to load users' }))"),
        ("toast.success('Password reset successfully')", "toast.success(t('admin.users.passwordResetSuccess', { defaultValue: 'Password reset successfully' }))"),
        ("'Please select a status'", "t('admin.users.selectStatus', { defaultValue: 'Please select a status' })"),
    ],
    # ── Merchants List ──
    'merchants/page.jsx': [
        ("toast.success('Merchant activated successfully')", "toast.success(t('admin.merchants.activateSuccess', { defaultValue: 'Merchant activated successfully' }))"),
        ("toast.success('Merchant suspended successfully')", "toast.success(t('admin.merchants.suspendSuccess', { defaultValue: 'Merchant suspended successfully' }))"),
        ("toast.error('Failed to update merchant status')", "toast.error(t('admin.merchants.updateError', { defaultValue: 'Failed to update merchant status' }))"),
    ],
    # ── Withdrawal Addresses List ──
    'withdrawal-addresses/page.jsx': [
        ('>Withdrawal Addresses<', ">{t('admin.withdrawalAddress.title', { defaultValue: 'Withdrawal Addresses' })}<"),
        ('>Manage user withdrawal addresses<', ">{t('admin.withdrawalAddress.description', { defaultValue: 'Manage user withdrawal addresses' })}<"),
        ('>No addresses found<', ">{t('admin.withdrawalAddress.noAddresses', { defaultValue: 'No addresses found' })}<"),
        ("toast.error('Failed to load withdrawal addresses')", "toast.error(t('admin.withdrawalAddress.loadError', { defaultValue: 'Failed to load withdrawal addresses' }))"),
        ("toast.error('Please provide a reason (minimum 10 characters)')", "toast.error(t('admin.withdrawalAddress.reasonRequired', { defaultValue: 'Please provide a reason (minimum 10 characters)' }))"),
        ("toast.error('Reason must be at least 10 characters')", "toast.error(t('admin.withdrawalAddress.reasonTooShort', { defaultValue: 'Reason must be at least 10 characters' }))"),
        ("toast.success('Address force verified successfully')", "toast.success(t('admin.withdrawalAddress.verifySuccess', { defaultValue: 'Address force verified successfully' }))"),
        ("toast.success('Address permanently deleted')", "toast.success(t('admin.withdrawalAddress.deleteSuccess', { defaultValue: 'Address permanently deleted' }))"),
    ],
    # ── Withdrawal Addresses Detail ──
    'withdrawal-addresses/[id]/page.jsx': [
        ('>Back to Withdrawal Addresses<', ">{t('admin.withdrawalAddress.backToList', { defaultValue: 'Back to Withdrawal Addresses' })}<"),
        ('>Address not found<', ">{t('admin.withdrawalAddress.notFound', { defaultValue: 'Address not found' })}<"),
        ("toast.error('Failed to load address')", "toast.error(t('admin.withdrawalAddress.loadDetailError', { defaultValue: 'Failed to load address' }))"),
        ("toast.error('Failed to load withdrawal address')", "toast.error(t('admin.withdrawalAddress.loadDetailError', { defaultValue: 'Failed to load withdrawal address' }))"),
        ('>Flag Address<', ">{t('admin.withdrawalAddress.flagAddress', { defaultValue: 'Flag Address' })}<"),
        ('>Remove Flag<', ">{t('admin.withdrawalAddress.removeFlag', { defaultValue: 'Remove Flag' })}<"),
        ('>Force Verify<', ">{t('admin.withdrawalAddress.forceVerify', { defaultValue: 'Force Verify' })}<"),
        ('>Permanent Delete<', ">{t('admin.withdrawalAddress.permanentDelete', { defaultValue: 'Permanent Delete' })}<"),
        ("toast.success('Address flagged successfully')", "toast.success(t('admin.withdrawalAddress.flagSuccess', { defaultValue: 'Address flagged successfully' }))"),
        ("toast.success('Address unflagged successfully')", "toast.success(t('admin.withdrawalAddress.unflagSuccess', { defaultValue: 'Address unflagged successfully' }))"),
        ("toast.success('Address verified successfully')", "toast.success(t('admin.withdrawalAddress.verifySuccess', { defaultValue: 'Address verified successfully' }))"),
        ("toast.success('Address deleted successfully')", "toast.success(t('admin.withdrawalAddress.deleteSuccess', { defaultValue: 'Address deleted successfully' }))"),
        ("toast.error('Please provide a reason (minimum 10 characters)')", "toast.error(t('admin.withdrawalAddress.reasonRequired', { defaultValue: 'Please provide a reason (minimum 10 characters)' }))"),
        ("toast.success('Address force verified successfully')", "toast.success(t('admin.withdrawalAddress.verifySuccess', { defaultValue: 'Address force verified successfully' }))"),
        ("toast.success('Address permanently deleted')", "toast.success(t('admin.withdrawalAddress.deleteSuccess', { defaultValue: 'Address permanently deleted' }))"),
        ('>Permanent Delete<', ">{t('admin.withdrawalAddress.permanentDelete', { defaultValue: 'Permanent Delete' })}<"),
        ("toast.success('Address flagged successfully')", "toast.success(t('admin.withdrawalAddress.flagSuccess', { defaultValue: 'Address flagged successfully' }))"),
        ("toast.success('Address unflagged successfully')", "toast.success(t('admin.withdrawalAddress.unflagSuccess', { defaultValue: 'Address unflagged successfully' }))"),
        ("toast.success('Address verified successfully')", "toast.success(t('admin.withdrawalAddress.verifySuccess', { defaultValue: 'Address verified successfully' }))"),
        ("toast.success('Address deleted successfully')", "toast.success(t('admin.withdrawalAddress.deleteSuccess', { defaultValue: 'Address deleted successfully' }))"),
        ("toast.error('Please provide a reason (minimum 10 characters)')", "toast.error(t('admin.withdrawalAddress.reasonRequired', { defaultValue: 'Please provide a reason (minimum 10 characters)' }))"),
        ("toast.success('Address force verified successfully')", "toast.success(t('admin.withdrawalAddress.verifySuccess', { defaultValue: 'Address force verified successfully' }))"),
        ("toast.success('Address permanently deleted')", "toast.success(t('admin.withdrawalAddress.deleteSuccess', { defaultValue: 'Address permanently deleted' }))"),
    ],
    # ── Temp Wallets Detail ──
    'temp-wallets/[id]/page.jsx': [
        ('>Back to Temp Wallets<', ">{t('admin.tempWallet.backToList', { defaultValue: 'Back to Temp Wallets' })}<"),
        ('>Wallet not found<', ">{t('admin.tempWallet.notFound', { defaultValue: 'Wallet not found' })}<"),
        ("toast.error('Failed to load wallet')", "toast.error(t('admin.tempWallet.loadDetailError', { defaultValue: 'Failed to load wallet' }))"),
        ("toast.error('Failed to load temp wallet')", "toast.error(t('admin.tempWallet.loadDetailError', { defaultValue: 'Failed to load temp wallet' }))"),
        ('>View Histories<', ">{t('admin.tempWallet.viewHistories', { defaultValue: 'View Histories' })}<"),
    ],
    # ── User Balances Detail ──
    'user-balances/[id]/page.jsx': [
        ('>Back to User Balances<', ">{t('admin.userBalance.backToList', { defaultValue: 'Back to User Balances' })}<"),
        ('>User not found<', ">{t('admin.userBalance.notFound', { defaultValue: 'User not found' })}<"),
        ("toast.error('Failed to load user balance')", "toast.error(t('admin.userBalance.loadDetailError', { defaultValue: 'Failed to load user balance' }))"),
        ("toast.error('Failed to load user balance detail')", "toast.error(t('admin.userBalance.loadDetailError', { defaultValue: 'Failed to load user balance detail' }))"),
        ('>Total Assets<', ">{t('admin.userBalance.totalAssets', { defaultValue: 'Total Assets' })}<"),
        ('>Total Value (USD)<', ">{t('admin.userBalance.totalValueUsd', { defaultValue: 'Total Value (USD)' })}<"),
    ],
    # ── Income Statement ──
    'income-statement/page.jsx': [
        ('>Today</', ">{t('admin.incomeStatement.today', { defaultValue: 'Today' })}</"),
        ('>Yesterday</', ">{t('admin.incomeStatement.yesterday', { defaultValue: 'Yesterday' })}</"),
        ('>This Month</', ">{t('admin.incomeStatement.thisMonth', { defaultValue: 'This Month' })}</"),
        ('>Last Month</', ">{t('admin.incomeStatement.lastMonth', { defaultValue: 'Last Month' })}</"),
        ('>Custom</', ">{t('admin.incomeStatement.custom', { defaultValue: 'Custom' })}</"),
        ("toast.error('From and To dates are required')", "toast.error(t('admin.incomeStatement.datesRequired', { defaultValue: 'From and To dates are required' }))"),
        ('>No transactions found<', ">{t('admin.incomeStatement.noTransactions', { defaultValue: 'No transactions found' })}<"),
    ],
    # ── Dashboard ──
    'dashboard/page.jsx': [
        ('>Today</', ">{t('admin.adminDashboard.today', { defaultValue: 'Today' })}</"),
        ('>Yesterday</', ">{t('admin.adminDashboard.yesterday', { defaultValue: 'Yesterday' })}</"),
        ('>This Month</', ">{t('admin.adminDashboard.thisMonth', { defaultValue: 'This Month' })}</"),
        ('>Last Month</', ">{t('admin.adminDashboard.lastMonth', { defaultValue: 'Last Month' })}</"),
        ('>Custom</', ">{t('admin.adminDashboard.custom', { defaultValue: 'Custom' })}</"),
    ],
    # ── Settings Page ──
    'settings/page.jsx': [
        ('>System Settings<', ">{t('admin.settings.title', { defaultValue: 'System Settings' })}<"),
        ('>View and manage system configuration<', ">{t('admin.settings.description', { defaultValue: 'View and manage system configuration' })}<"),
        ('>All Categories<', ">{t('admin.settings.allCategories', { defaultValue: 'All Categories' })}<"),
        ('>All Scopes<', ">{t('admin.settings.allScopes', { defaultValue: 'All Scopes' })}<"),
        ('>No settings found<', ">{t('admin.settings.noSettings', { defaultValue: 'No settings found' })}<"),
        ("toast.error('Failed to load settings')", "toast.error(t('admin.settings.loadError', { defaultValue: 'Failed to load settings' }))"),
    ],
    # ── System Wallets List ──
    'system-wallets/page.jsx': [
        ("toast.success('Address copied to clipboard')", "toast.success(t('actions.copied', { defaultValue: 'Address copied to clipboard' }))"),
        ("toast.error('Failed to copy address')", "toast.error(t('actions.copyFailed', { defaultValue: 'Failed to copy address' }))"),
    ],
    # ── Webhook Logs List ──
    'merchant-webhook-logs/page.jsx': [
        ("toast.error('Failed to load webhook logs')", "toast.error(t('admin.webhookLog.loadError', { defaultValue: 'Failed to load webhook logs' }))"),
        ('>No webhook logs found<', ">{t('admin.webhookLog.noLogs', { defaultValue: 'No webhook logs found' })}<"),
    ],
    # ── Component: TempWalletHistoryDetail ──
    'TempWalletHistoryDetail.jsx': [
        ("toast.error('Failed to load history')", "toast.error(t('admin.tempWallet.loadHistoryError', { defaultValue: 'Failed to load history' }))"),
    ],
    # ── Component: TempWalletHistoryList ──
    'TempWalletHistoryList.jsx': [
        ("toast.error('Failed to load temp wallet histories')", "toast.error(t('admin.tempWallet.loadHistoriesError', { defaultValue: 'Failed to load temp wallet histories' }))"),
        ('>No histories found<', ">{t('admin.tempWallet.noHistories', { defaultValue: 'No histories found' })}<"),
    ],
}

# ─── Processing ─────────────────────────────────────────────────────────────────

def find_admin_files():
    """Find all admin JSX files."""
    patterns = [
        os.path.join(WEB_ROOT, 'app/(dashboard)/admin/**/*.jsx'),
        os.path.join(WEB_ROOT, 'components/admin/**/*.jsx'),
    ]
    files = []
    for p in patterns:
        files.extend(glob.glob(p, recursive=True))
    return sorted(files)


def apply_replacements(filepath, content):
    """Apply all applicable replacements to file content."""
    original = content
    changes = []

    # 1. Apply global attribute replacements
    for old, new in ATTR_REPLACEMENTS:
        if old in content:
            content = content.replace(old, new)
            changes.append(f'  attr: {old[:50]}...')

    # 2. Apply global JSX text replacements
    for old, new in JSX_TEXT_REPLACEMENTS:
        if old in content:
            content = content.replace(old, new)
            changes.append(f'  jsx: {old[:50]}...')

    # 3. Apply icon text replacements
    for old, new in ICON_TEXT_REPLACEMENTS:
        if old in content:
            content = content.replace(old, new)
            changes.append(f'  icon: {old[:50]}...')

    # 4. Apply global toast replacements
    for old, new in TOAST_REPLACEMENTS:
        if old in content:
            content = content.replace(old, new)
            changes.append(f'  toast: {old[:50]}...')

    # 5. Apply file-specific replacements
    rel = os.path.relpath(filepath, WEB_ROOT)
    for key, replacements in FILE_SPECIFIC.items():
        if key in rel:
            for old, new in replacements:
                if old in content:
                    content = content.replace(old, new)
                    changes.append(f'  specific[{key}]: {old[:50]}...')

    return content, changes


def ensure_use_translation(content, filepath):
    """Ensure file has useTranslation import if t() calls were added."""
    if "useTranslation" in content:
        return content, False

    if "{t(" not in content and "t('" not in content:
        return content, False

    # Add import after last import line
    lines = content.split('\n')
    last_import_idx = -1
    for i, line in enumerate(lines):
        if line.strip().startswith('import '):
            last_import_idx = i

    if last_import_idx >= 0:
        lines.insert(last_import_idx + 1, "import { useTranslation } from 'react-i18next'")
        return '\n'.join(lines), True

    return content, False


def ensure_t_destructure(content, filepath):
    """If useTranslation is imported but t is not destructured, add it."""
    if "useTranslation" not in content:
        return content, False

    # Check if { t } is already destructured
    if re.search(r'const\s*\{\s*t\s*\}\s*=\s*useTranslation', content):
        return content, False

    # Check if there's a useTranslation() call returning to a variable
    if re.search(r'=\s*useTranslation\(', content):
        return content, False

    return content, False


def main():
    files = find_admin_files()
    print(f'Found {len(files)} admin files')

    total_changes = 0
    modified_files = 0

    for filepath in files:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content, changes = apply_replacements(filepath, content)

        if changes:
            # Ensure useTranslation import
            new_content, added_import = ensure_use_translation(new_content, filepath)
            if added_import:
                changes.append('  added useTranslation import')

            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)

            rel = os.path.relpath(filepath, WEB_ROOT)
            print(f'\n✅ {rel} ({len(changes)} changes)')
            for c in changes[:5]:
                print(c)
            if len(changes) > 5:
                print(f'  ... and {len(changes) - 5} more')

            total_changes += len(changes)
            modified_files += 1

    print(f'\n{"="*60}')
    print(f'Total: {total_changes} replacements in {modified_files} files')


if __name__ == '__main__':
    main()
