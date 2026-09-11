import React from 'react';
import type { QuickBillReport, QuickBillRow } from '../../../api/quick-bill/quick-bill-api-service';

const n = (v?: number) => Number(v || 0).toFixed(2);
const payLabel = (mode?: string) => (mode === 'gpay' ? 'GPay' : mode === 'cash' ? 'Cash' : mode || '—');

type Props = {
  data: QuickBillReport;
  emptyText: string;
  canManage?: boolean;
  onEdit?: (row: QuickBillRow) => void;
  onCancel?: (row: QuickBillRow) => void;
  section?: 'all' | 'kpis' | 'bills';
  incentiveEarn?: number;
  nextTarget?: number | null;
  toNext?: number | null;
};

const CollectionDetails: React.FC<Props> = ({
  data,
  emptyText,
  canManage,
  onEdit,
  onCancel,
  section = 'all',
  incentiveEarn = 0,
  nextTarget,
  toNext,
}) => {
  const rows = data.rows || [];
  const showKpis = section === 'all' || section === 'kpis';
  const showBills = section === 'all' || section === 'bills';
  const tipsCash = rows.reduce((sum, row) => {
    if (row.isCancelled === 1 || Number(row.tipsAmount || 0) <= 0) return sum;
    return row.tipsPayMode === 'gpay' ? sum : sum + Number(row.tipsAmount);
  }, 0);
  const tipsGpay = rows.reduce((sum, row) => {
    if (row.isCancelled === 1 || Number(row.tipsAmount || 0) <= 0) return sum;
    return row.tipsPayMode === 'gpay' ? sum + Number(row.tipsAmount) : sum;
  }, 0);
  const incentive = Number(incentiveEarn || 0);
  const expense = Number(data.expenseTotal || 0);
  const cashFinal = Number(data.cashTotal || 0) - tipsCash - tipsGpay - incentive - expense;
  const bankFinal = Number(data.gpayTotal || 0);
  return (
    <>
      {showKpis && (
        <div className="qb-kpis">
          <div className="qb-kpi collect">
            <div className="qb-kpi-col">
              <div className="qb-kpi-l">Bills</div>
              <div className="qb-kpi-v">{data.count || 0}</div>
            </div>
            <div className="qb-kpi-col">
              <div className="qb-kpi-l">Cash</div>
              <div className="qb-kpi-v">{n(data.cashTotal)}</div>
              <div className="qb-kpi-note">(including tips)</div>
            </div>
            <div className="qb-kpi-col">
              <div className="qb-kpi-l">GPay</div>
              <div className="qb-kpi-v">{n(data.gpayTotal)}</div>
              <div className="qb-kpi-note">(including tips)</div>
            </div>
            <div className="qb-kpi-col">
              <div className="qb-kpi-l">Total</div>
              <div className="qb-kpi-v">{n(data.grandTotal)}</div>
            </div>
          </div>
          <div className="qb-kpi tips">
            <span className="qb-kpi-ico"><i className="fas fa-hand-holding-usd" /></span>
            <div>
              <div className="qb-kpi-l">Tips</div>
              <div className="qb-kpi-v">{n(data.tipsTotal)}</div>
              <div className="qb-kpi-split">
                <span>Cash {n(tipsCash)}</span>
                <span>GPay {n(tipsGpay)}</span>
              </div>
            </div>
          </div>
          <div className="qb-kpi incentive">
            <span className="qb-kpi-ico"><i className="fas fa-gift" /></span>
            <div>
              <div className="qb-kpi-l">Incentive Earned</div>
              <div className="qb-kpi-v">{n(incentive)}</div>
              {nextTarget != null && (
                <div className="qb-kpi-split">To next {n(toNext)}</div>
              )}
            </div>
          </div>
          <div className="qb-kpi expense">
            <span className="qb-kpi-ico"><i className="fas fa-money-bill-wave" /></span>
            <div>
              <div className="qb-kpi-l">Expense</div>
              <div className="qb-kpi-v">{n(expense)}</div>
            </div>
          </div>
          <div className="qb-kpi final">
            <div className="qb-kpi-col">
              <div className="qb-kpi-l">Final Cash</div>
              <div className="qb-kpi-v">{n(cashFinal)}</div>
              <div className="qb-kpi-note">− tips − incentive − expense</div>
            </div>
            <div className="qb-kpi-col">
              <div className="qb-kpi-l">Final Bank</div>
              <div className="qb-kpi-v">{n(bankFinal)}</div>
              <div className="qb-kpi-note">GPay total</div>
            </div>
          </div>
        </div>
      )}

      {showBills && (
      <div className="mst-card">
        <div className="mst-card-h">
          <span>Collection details</span>
          {rows.length > 0 && <span className="qb-bills-total">Total {n(data.grandTotal)}</span>}
        </div>
        {rows.length === 0 ? (
          <div className="mst-empty">{emptyText}</div>
        ) : (
          <div className="qb-bills">
            {rows.map((row) => {
              const cancelled = row.isCancelled === 1;
              return (
                <article key={row.id} className={`qb-bill-card ${cancelled ? 'cancelled' : ''}`}>
                  <div className="qb-bill-top">
                    <strong>{n(row.amount)}</strong>
                    <span className={`qb-pay-tag ${cancelled ? 'off' : row.payMode === 'gpay' ? 'gpay' : 'cash'}`}>
                      {cancelled ? 'Cancelled' : payLabel(row.payMode)}
                    </span>
                  </div>
                  <div className="qb-bill-meta">
                    <span>{row.billDate}</span>
                    <span>{row.billTime}</span>
                    <span>{row.shopName || row.shopId || '—'}</span>
                  </div>
                  <div className="qb-bill-user">{row.userName || '—'}</div>
                  {Number(row.tipsAmount || 0) > 0 ? (
                    <div className="qb-bill-tips">
                      <span>Tip {n(row.tipsAmount)}</span>
                      <span className={`qb-pay-tag ${row.tipsPayMode === 'gpay' ? 'gpay' : 'cash'}`}>
                        {payLabel(row.tipsPayMode)}
                      </span>
                    </div>
                  ) : null}
                  {false && row.notes ? <p className="qb-bill-notes">{row.notes}</p> : null}
                  {canManage && !cancelled && (
                    <div className="qb-bill-acts">
                      <button className="mst-icon-btn" type="button" onClick={() => onEdit?.(row)}>
                        <i className="fas fa-edit" /> Edit
                      </button>
                      <button className="mst-icon-btn danger" type="button" onClick={() => onCancel?.(row)}>
                        <i className="fas fa-ban" /> Cancel
                      </button>
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
      )}
    </>
  );
};

export default CollectionDetails;
