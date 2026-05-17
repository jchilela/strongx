'use client';

import { useState } from 'react';
import { Wallet, RefreshCw } from 'lucide-react';
import { useTransactions, useSyncPayments } from '@/hooks/useWallet';
import {
  TransactionStatusBadge,
  TransactionTypeBadge,
} from '@/components/shared/StatusBadge';
import { TableLoader } from '@/components/shared/LoadingSpinner';
import { EmptyState } from '@/components/shared/EmptyState';
import { Pagination } from '@/components/shared/Pagination';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useLang } from '@/lib/lang';

export function TransactionHistory() {
  const [page, setPage] = useState(1);
  const limit = 15;
  const { data, isLoading } = useTransactions(page, limit);
  const { mutate: syncPayments, isPending: isSyncing } = useSyncPayments();
  const { t } = useLang();

  return (
    <div className="bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <h2 className="text-base font-semibold text-gray-900">{t.wallet.transactionHistory}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => syncPayments()}
            disabled={isSyncing}
            className="flex items-center gap-1.5 text-xs text-[#6366f1] hover:text-indigo-700 disabled:opacity-50 transition-colors"
            title="Check AppyPay for payment updates"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? t.wallet.checkingPayments : t.wallet.refreshStatus}
          </button>
          {data && (
            <span className="text-xs text-gray-400">{data.total} {t.wallet.transactions}</span>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>{t.wallet.date}</th>
              <th>{t.wallet.type}</th>
              <th>{t.wallet.description}</th>
              <th className="hidden lg:table-cell">{t.wallet.entityRef}</th>
              <th>{t.wallet.amount}</th>
              <th>{t.wallet.status}</th>
            </tr>
          </thead>

          {isLoading ? (
            <TableLoader rows={8} cols={6} />
          ) : data?.transactions && data.transactions.length > 0 ? (
            <tbody>
              {data.transactions.map((tx) => (
                <tr key={tx.id}>
                  <td className="text-xs text-gray-500 whitespace-nowrap">
                    {formatDate(tx.createdAt)}
                  </td>
                  <td>
                    <TransactionTypeBadge type={tx.type} />
                  </td>
                  <td className="text-gray-700 text-sm">{tx.description}</td>
                  <td className="hidden lg:table-cell font-mono text-xs text-gray-500">
                    {tx.entity && tx.paymentReference ? (
                      <span>
                        <span className="text-gray-400">{tx.entity} / </span>
                        {tx.paymentReference}
                      </span>
                    ) : (
                      tx.reference || '—'
                    )}
                  </td>
                  <td
                    className={`font-semibold text-sm ${
                      tx.type === 'credit' ? 'text-green-700' : 'text-red-700'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </td>
                  <td>
                    <TransactionStatusBadge status={tx.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          ) : (
            <tbody>
              <tr>
                <td colSpan={6} className="py-0">
                  <EmptyState
                    icon={Wallet}
                    title={t.wallet.noTransactions}
                    description={t.wallet.noTransactionsDesc}
                  />
                </td>
              </tr>
            </tbody>
          )}
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="p-4 border-t border-gray-100">
          <Pagination
            page={page}
            totalPages={data.totalPages}
            total={data.total}
            limit={limit}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
