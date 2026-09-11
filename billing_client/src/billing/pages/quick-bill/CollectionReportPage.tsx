import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  quickBillApi,
  quickBillData,
  quickBillError,
  type QuickBillReport,
  type QuickBillRow,
  type QuickBillTrend,
} from '../../../api/quick-bill/quick-bill-api-service';
import { usersApi, usersData } from '../../../api/users/users-api-service';
import '../master/Master.css';
import '../credit/Credit.css';
import './QuickBill.css';
import CollectionDetails from './CollectionDetails';
import CollectionTrendChart from './CollectionTrendChart';

type UserOpt = { id: number; name: string };
type Outlet = { shopId: string; shopName: string };
type PayMode = 'cash' | 'gpay';
type Modal = { type: 'edit' | 'cancel'; row: QuickBillRow } | null;

const today = () => new Date().toISOString().slice(0, 10);

const CollectionReportPage: React.FC = () => {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [userId, setUserId] = useState('');
  const [shopId, setShopId] = useState('');
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [shops, setShops] = useState<Outlet[]>([]);
  const [data, setData] = useState<QuickBillReport | null>(null);
  const [trend, setTrend] = useState<QuickBillTrend | null>(null);
  const [trendBusy, setTrendBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [amount, setAmount] = useState('');
  const [payMode, setPayMode] = useState<PayMode>('cash');
  const [notes, setNotes] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    usersApi.outlets()
      .then((res) => setShops(usersData<Outlet[]>(res) || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setUserId('');
    if (!shopId) {
      setUsers([]);
      return;
    }
    usersApi.list(shopId)
      .then((res) => setUsers(usersData<UserOpt[]>(res) || []))
      .catch(() => setUsers([]));
  }, [shopId]);

  const loadTrend = async (uid = userId, sid = shopId) => {
    setTrendBusy(true);
    try {
      setTrend(quickBillData<QuickBillTrend>(await quickBillApi.trend({
        days: 10,
        userId: uid ? Number(uid) : undefined,
        shopId: sid || undefined,
      })));
    } catch (err) {
      toast.error(quickBillError(err, 'Could not load 10-day graph'));
    } finally {
      setTrendBusy(false);
    }
  };

  useEffect(() => {
    loadTrend(userId, shopId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shopId, userId]);

  const search = async () => {
    if (!from || !to) {
      toast.warning('Select from and to date');
      return;
    }
    setBusy(true);
    try {
      const res = await quickBillApi.report(
        from,
        to,
        userId ? Number(userId) : undefined,
        shopId || undefined
      );
      setData(quickBillData<QuickBillReport>(res));
    } catch (err) {
      toast.error(quickBillError(err, 'Could not load collection report'));
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (row: QuickBillRow) => {
    setAmount(String(row.amount ?? ''));
    setPayMode(row.payMode === 'gpay' ? 'gpay' : 'cash');
    setNotes(row.notes || '');
    setModal({ type: 'edit', row });
  };

  const openCancel = (row: QuickBillRow) => {
    setReason('');
    setModal({ type: 'cancel', row });
  };

  const saveEdit = async () => {
    if (!modal) return;
    const value = parseFloat(amount);
    if (!Number.isFinite(value) || value <= 0) {
      toast.warning('Enter a valid amount');
      return;
    }
    setBusy(true);
    try {
      await quickBillApi.update(modal.row.id, { amount: value, payMode, notes: notes.trim() });
      toast.success('Bill updated');
      setModal(null);
      await search();
      await loadTrend();
    } catch (err) {
      toast.error(quickBillError(err, 'Could not update bill'));
    } finally {
      setBusy(false);
    }
  };

  const saveCancel = async () => {
    if (!modal) return;
    if (!reason.trim()) {
      toast.warning('Enter a cancel reason');
      return;
    }
    setBusy(true);
    try {
      await quickBillApi.cancel(modal.row.id, reason.trim());
      toast.success('Bill cancelled');
      setModal(null);
      await search();
      await loadTrend();
    } catch (err) {
      toast.error(quickBillError(err, 'Could not cancel bill'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mst-page qb-report-page">
      <h2 className="mst-title"><i className="fas fa-chart-line" /> Collection Report</h2>
      <div className="mst-card qb-report-filters">
        <div className="mst-card-b mst-form">
          <div className="mst-fg">
            <label>From Date</label>
            <input className="mst-inp" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="mst-fg">
            <label>To Date</label>
            <input className="mst-inp" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div className="mst-fg">
            <label>Shop</label>
            <select className="mst-sel" value={shopId} onChange={(e) => setShopId(e.target.value)}>
              <option value="">All Shops</option>
              {shops.map((s) => (
                <option key={s.shopId} value={s.shopId}>{s.shopName}</option>
              ))}
            </select>
          </div>
          <div className="mst-fg">
            <label>User</label>
            <select className="mst-sel" value={userId} onChange={(e) => setUserId(e.target.value)} disabled={!shopId}>
              <option value="">{shopId ? 'All Users' : 'Select shop first'}</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div className="mst-actions" style={{ gridColumn: '1 / -1' }}>
            <button className="mst-btn mst-btn-primary" type="button" onClick={search} disabled={busy}>
              {busy ? 'Loading…' : 'Show Details'}
            </button>
          </div>
        </div>
      </div>
      {data && (
        <CollectionDetails
          data={data}
          emptyText="No collection found for the selected filters."
          section="kpis"
        />
      )}
      <CollectionTrendChart
        data={trend}
        loading={trendBusy && !trend}
        title="Last 10 days"
        subtitle={
          userId
            ? 'Selected user · last 10 days'
            : shopId
              ? 'Selected shop · last 10 days'
              : 'All shops · last 10 days'
        }
      />
      {data && (
        <CollectionDetails
          data={data}
          emptyText="No collection found for the selected filters."
          canManage
          onEdit={openEdit}
          onCancel={openCancel}
          section="bills"
        />
      )}

      {modal && (
        <div className="qb-modal" onClick={() => setModal(null)}>
          <div className="qb-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="mst-card-h">{modal.type === 'edit' ? 'Edit Bill' : 'Cancel Bill'}</div>
            <div className="mst-card-b">
              {modal.type === 'edit' ? (
                <>
                  <div className="mst-fg" style={{ marginBottom: 10 }}>
                    <label>Amount</label>
                    <input className="mst-inp" type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
                  </div>
                  <div className="qb-pay" style={{ marginBottom: 10 }}>
                    <button type="button" className={`qb-pay-btn ${payMode === 'cash' ? 'on' : ''}`} onClick={() => setPayMode('cash')}>Cash</button>
                    <button type="button" className={`qb-pay-btn ${payMode === 'gpay' ? 'on' : ''}`} onClick={() => setPayMode('gpay')}>GPay</button>
                  </div>
                  <div className="mst-fg" style={{ marginBottom: 10 }}>
                    <label>Notes</label>
                    <textarea className="mst-area" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
                  </div>
                </>
              ) : (
                <div className="mst-fg" style={{ marginBottom: 10 }}>
                  <label>Reason <span className="req">*</span></label>
                  <textarea className="mst-area" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why is this bill cancelled?" />
                </div>
              )}
              <div className="mst-actions">
                <button className="mst-btn mst-btn-outline" type="button" onClick={() => setModal(null)}>Close</button>
                {modal.type === 'edit' ? (
                  <button className="mst-btn mst-btn-primary" type="button" disabled={busy} onClick={saveEdit}>
                    {busy ? 'Saving…' : 'Save'}
                  </button>
                ) : (
                  <button className="mst-btn mst-btn-primary" type="button" disabled={busy} onClick={saveCancel}>
                    {busy ? 'Saving…' : 'Cancel Bill'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollectionReportPage;
