import React, { useState } from 'react';
import { toast } from 'react-toastify';
import {
  quickBillApi,
  quickBillData,
  quickBillError,
  type QuickBillLog,
} from '../../../api/quick-bill/quick-bill-api-service';
import '../master/Master.css';
import '../quick-bill/QuickBill.css';

const today = () => new Date().toISOString().slice(0, 10);
const n = (v?: number) => Number(v || 0).toFixed(2);
const payLabel = (mode?: string) => (mode === 'gpay' ? 'GPay' : mode === 'cash' ? 'Cash' : mode || '—');

const EditLogPage: React.FC = () => {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [rows, setRows] = useState<QuickBillLog[] | null>(null);
  const [busy, setBusy] = useState(false);

  const search = async () => {
    if (!from || !to) {
      toast.warning('Select from and to date');
      return;
    }
    setBusy(true);
    try {
      setRows(quickBillData<QuickBillLog[]>(await quickBillApi.logs(from, to)) || []);
    } catch (err) {
      toast.error(quickBillError(err, 'Could not load edit log'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-history" /> Edit Log</h2>
      <div className="mst-card" style={{ marginBottom: 12 }}>
        <div className="mst-card-b mst-form">
          <div className="mst-fg">
            <label>From Date</label>
            <input className="mst-inp" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="mst-fg">
            <label>To Date</label>
            <input className="mst-inp" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="mst-actions">
            <button className="mst-btn mst-btn-primary" type="button" onClick={search} disabled={busy}>
              {busy ? 'Loading…' : 'Show Log'}
            </button>
          </div>
        </div>
      </div>
      {rows && (
        <div className="mst-card">
          <div className="mst-card-h">Bill edit and cancel history</div>
          <div className="mst-table-wrap">
            <table className="mst-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Action</th>
                  <th>Bill</th>
                  <th>Old</th>
                  <th>New</th>
                  <th>User</th>
                  <th>Shop</th>
                  <th>Reason / Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={10} className="mst-empty">No edits or cancellations for this period.</td></tr>
                ) : (
                  rows.map((row, i) => (
                    <tr key={row.id}>
                      <td>{i + 1}</td>
                      <td>{row.logDate}</td>
                      <td>{row.logTime}</td>
                      <td>{row.action === 'cancel' ? 'Cancel' : 'Edit'}</td>
                      <td>#{row.billId}</td>
                      <td>₹ {n(row.oldAmount)} {payLabel(row.oldPayMode)}</td>
                      <td>{row.action === 'cancel' ? '—' : `₹ ${n(row.newAmount)} ${payLabel(row.newPayMode)}`}</td>
                      <td>{row.userName || '—'}</td>
                      <td>{row.shopName || '—'}</td>
                      <td>{row.action === 'cancel' ? (row.reason || '—') : (row.newNotes || row.oldNotes || '—')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditLogPage;
