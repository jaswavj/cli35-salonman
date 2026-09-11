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
};

const CollectionDetails: React.FC<Props> = ({ data, emptyText, canManage, onEdit, onCancel, section = 'all' }) => {
  const rows = data.rows || [];
  const showKpis = section === 'all' || section === 'kpis';
  const showBills = section === 'all' || section === 'bills';
  return (
    <>
      {showKpis && (
        <div className="qb-kpis">
          <div className="qb-kpi bills">
            <span className="qb-kpi-ico"><i className="fas fa-receipt" /></span>
            <div>
              <div className="qb-kpi-l">Bills</div>
              <div className="qb-kpi-v">{data.count || 0}</div>
            </div>
          </div>
          <div className="qb-kpi cash">
            <span className="qb-kpi-ico"><i className="fas fa-money-bill-wave" /></span>
            <div>
              <div className="qb-kpi-l">Cash</div>
              <div className="qb-kpi-v">₹ {n(data.cashTotal)}</div>
            </div>
          </div>
          <div className="qb-kpi gpay">
            <span className="qb-kpi-ico"><i className="fas fa-mobile-alt" /></span>
            <div>
              <div className="qb-kpi-l">GPay</div>
              <div className="qb-kpi-v">₹ {n(data.gpayTotal)}</div>
            </div>
          </div>
          <div className="qb-kpi total">
            <span className="qb-kpi-ico"><i className="fas fa-coins" /></span>
            <div>
              <div className="qb-kpi-l">Total</div>
              <div className="qb-kpi-v">₹ {n(data.grandTotal)}</div>
            </div>
          </div>
        </div>
      )}

      {showBills && (
      <div className="mst-card">
        <div className="mst-card-h">
          <span>Collection details</span>
          {rows.length > 0 && <span className="qb-bills-total">Total ₹ {n(data.grandTotal)}</span>}
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
                    <strong>₹ {n(row.amount)}</strong>
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
                  {row.notes ? <p className="qb-bill-notes">{row.notes}</p> : null}
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
