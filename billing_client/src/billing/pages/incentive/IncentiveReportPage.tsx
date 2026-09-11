import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  incentiveApi,
  incentiveData,
  incentiveError,
  type IncentiveProgress,
  type IncentiveReport,
} from '../../../api/incentive/incentive-api-service';
import { usersApi, usersData } from '../../../api/users/users-api-service';
import '../master/Master.css';
import '../quick-bill/QuickBill.css';
import './Incentive.css';

type UserOpt = { id: number; name: string };
type Outlet = { shopId: string; shopName: string };

const today = () => new Date().toISOString().slice(0, 10);
const n = (v?: number | null) => Number(v || 0).toFixed(2);

const IncentiveReportPage: React.FC = () => {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [shopId, setShopId] = useState('');
  const [userId, setUserId] = useState('');
  const [shops, setShops] = useState<Outlet[]>([]);
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [data, setData] = useState<IncentiveReport | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    usersApi.outlets()
      .then((res) => setShops(usersData<Outlet[]>(res) || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setUserId('');
    usersApi.list(shopId || undefined)
      .then((res) => setUsers(usersData<UserOpt[]>(res) || []))
      .catch(() => setUsers([]));
  }, [shopId]);

  const search = async () => {
    if (!from || !to) {
      toast.warning('Select from and to date');
      return;
    }
    setBusy(true);
    try {
      setData(incentiveData<IncentiveReport>(await incentiveApi.report(
        from,
        to,
        userId ? Number(userId) : undefined,
        shopId || undefined
      )));
    } catch (err) {
      toast.error(incentiveError(err, 'Could not load incentive report'));
    } finally {
      setBusy(false);
    }
  };

  const rows = data?.rows || [];

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-coins" /> Incentive Report</h2>
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
            <select className="mst-sel" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">All Users</option>
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
        <>
          <div className="qb-kpis">
            <div className="qb-kpi bills">
              <span className="qb-kpi-ico"><i className="fas fa-users" /></span>
              <div>
                <div className="qb-kpi-l">Staff</div>
                <div className="qb-kpi-v">{data.count || 0}</div>
              </div>
            </div>
            <div className="qb-kpi cash">
              <span className="qb-kpi-ico"><i className="fas fa-coins" /></span>
              <div>
                <div className="qb-kpi-l">Collection</div>
                <div className="qb-kpi-v">₹ {n(data.collectionTotal)}</div>
              </div>
            </div>
            <div className="qb-kpi total">
              <span className="qb-kpi-ico"><i className="fas fa-gift" /></span>
              <div>
                <div className="qb-kpi-l">Incentive earn</div>
                <div className="qb-kpi-v">₹ {n(data.incentiveTotal)}</div>
              </div>
            </div>
          </div>
          <div className="mst-card">
            <div className="mst-card-h">Incentive details</div>
            {rows.length === 0 ? (
              <div className="mst-empty">No staff found for the selected filters.</div>
            ) : (
              <div className="qb-bills">
                {rows.map((row: IncentiveProgress) => (
                  <article key={`${row.shopId}-${row.userId}`} className="qb-bill-card">
                    <div className="qb-bill-top">
                      <strong>{row.userName || '—'}</strong>
                      <span className="att-tag in">₹ {n(row.incentiveEarn)}</span>
                    </div>
                    <div className="qb-bill-meta">
                      <span>{row.shopName || row.shopId || '—'}</span>
                    </div>
                    <div className="qb-bill-user">Collection ₹ {n(row.collection)}</div>
                    <div className="qb-bill-notes">
                      Target {row.target != null ? `₹ ${n(row.target)}` : '—'}
                      {row.nextTarget != null ? ` · ₹ ${n(row.toNext)} to next ₹ ${n(row.nextTarget)}` : ''}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default IncentiveReportPage;
