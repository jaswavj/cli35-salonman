import React from 'react';
import type { QuickBillAccounts } from '../../../api/quick-bill/quick-bill-api-service';

const n = (v?: number) =>
  Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const amt = (v?: number) => (Number(v || 0) === 0 ? '' : n(v));

type Props = {
  data: QuickBillAccounts;
  emptyText: string;
};

const CollectionAccounts: React.FC<Props> = ({ data, emptyText }) => {
  const rows = (data.rows || []).filter(
    (row) => Number(row.cashTotal || 0) !== 0 || Number(row.bankTotal || 0) !== 0
  );
  return (
    <>
      <div className="qb-kpis qb-account-kpis">
        <div className="qb-kpi collect qb-account-collect">
          <div className="qb-kpi-col">
            <div className="qb-kpi-l">Cash</div>
            <div className="qb-kpi-v">{n(data.cashTotal)}</div>
          </div>
          <div className="qb-kpi-col">
            <div className="qb-kpi-l">Bank</div>
            <div className="qb-kpi-v">{n(data.bankTotal)}</div>
          </div>
          <div className="qb-kpi-col">
            <div className="qb-kpi-l">Total</div>
            <div className="qb-kpi-v">{n(data.grandTotal)}</div>
          </div>
        </div>
        <div className="qb-kpi tips">
          <span className="qb-kpi-ico"><i className="fas fa-hand-holding-usd" /></span>
          <div>
            <div className="qb-kpi-l">GPay Tips</div>
            <div className="qb-kpi-v">{n(data.tipsTotal)}</div>
          </div>
        </div>
        <div className="qb-kpi incentive">
          <span className="qb-kpi-ico"><i className="fas fa-gift" /></span>
          <div>
            <div className="qb-kpi-l">Incentive</div>
            <div className="qb-kpi-v">{n(data.incentiveTotal)}</div>
          </div>
        </div>
        <div className="qb-kpi expense">
          <span className="qb-kpi-ico"><i className="fas fa-money-bill-wave" /></span>
          <div>
            <div className="qb-kpi-l">Expense</div>
            <div className="qb-kpi-v">{n(data.expenseTotal)}</div>
          </div>
        </div>
        <div className="qb-kpi final">
          <div className="qb-kpi-col">
            <div className="qb-kpi-l">Final Cash</div>
            <div className="qb-kpi-v">{n(data.finalCashTotal)}</div>
          </div>
          <div className="qb-kpi-col">
            <div className="qb-kpi-l">Final Bank</div>
            <div className="qb-kpi-v">{n(data.finalBankTotal)}</div>
          </div>
        </div>
      </div>

      <div className="mst-card">
        <div className="mst-card-h">
          <span>User accounts{data.shopName ? ` · ${data.shopName}` : ''}</span>
          <span className="qb-bills-total">{rows.length} users</span>
        </div>
        {rows.length === 0 ? (
          <div className="mst-empty">{emptyText}</div>
        ) : (
          <div className="mst-table-wrap">
            <table className="mst-table qb-account-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th className="num">Cash</th>
                  <th className="num">Bank</th>
                  <th className="num">Total</th>
                  <th className="num">GPay Tips</th>
                  <th className="num">Incentive</th>
                  <th className="num">Expense</th>
                  <th className="num">Final Cash</th>
                  <th className="num">Final Bank</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.userId}>
                    <td>{row.userName || '—'}</td>
                    <td className="num">{amt(row.cashTotal)}</td>
                    <td className="num">{amt(row.bankTotal)}</td>
                    <td className="num">{n(row.total)}</td>
                    <td className="num">{n(row.tipsBank ?? row.tipsTotal)}</td>
                    <td className="num">{n(row.incentiveEarn)}</td>
                    <td className="num">{n(row.expenseTotal)}</td>
                    <td className="num">{n(row.finalCash)}</td>
                    <td className="num">{n(row.finalBank)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th>Total</th>
                  <th className="num">{n(data.cashTotal)}</th>
                  <th className="num">{n(data.bankTotal)}</th>
                  <th className="num">{n(data.grandTotal)}</th>
                  <th className="num">{n(data.tipsTotal)}</th>
                  <th className="num">{n(data.incentiveTotal)}</th>
                  <th className="num">{n(data.expenseTotal)}</th>
                  <th className="num">{n(data.finalCashTotal)}</th>
                  <th className="num">{n(data.finalBankTotal)}</th>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </>
  );
};

export default CollectionAccounts;
