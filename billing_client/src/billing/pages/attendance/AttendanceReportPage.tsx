import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  attendanceApi,
  attendanceData,
  attendanceError,
  type AttendanceReport,
  type AttendanceRow,
} from '../../../api/attendance/attendance-api-service';
import { usersApi, usersData } from '../../../api/users/users-api-service';
import '../master/Master.css';
import '../quick-bill/QuickBill.css';
import './Attendance.css';

type UserOpt = { id: number; name: string };
type Outlet = { shopId: string; shopName: string };

const today = () => new Date().toISOString().slice(0, 10);

const formatHours = (minutes?: number) => {
  const m = Math.max(0, Number(minutes || 0));
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${String(min).padStart(2, '0')}m`;
};

const AttendanceReportPage: React.FC = () => {
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());
  const [userId, setUserId] = useState('');
  const [shopId, setShopId] = useState('');
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [shops, setShops] = useState<Outlet[]>([]);
  const [data, setData] = useState<AttendanceReport | null>(null);
  const [busy, setBusy] = useState(false);
  const [edit, setEdit] = useState<AttendanceRow | null>(null);
  const [punchDate, setPunchDate] = useState('');
  const [punchTime, setPunchTime] = useState('');
  const [notes, setNotes] = useState('');

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

  const search = async () => {
    if (!from || !to) {
      toast.warning('Select from and to date');
      return;
    }
    setBusy(true);
    try {
      setData(attendanceData<AttendanceReport>(await attendanceApi.report(
        from,
        to,
        userId ? Number(userId) : undefined,
        shopId || undefined
      )));
    } catch (err) {
      toast.error(attendanceError(err, 'Could not load attendance report'));
    } finally {
      setBusy(false);
    }
  };

  const openEdit = (row: AttendanceRow) => {
    setPunchDate(row.punchDateIso || '');
    setPunchTime(row.punchTimeIso || '');
    setNotes(row.notes || '');
    setEdit(row);
  };

  const saveEdit = async () => {
    if (!edit) return;
    if (!punchDate || !punchTime) {
      toast.warning('Date and time are required');
      return;
    }
    setBusy(true);
    try {
      await attendanceApi.update(edit.id, {
        punchType: edit.punchType === 'out' ? 'out' : 'in',
        punchDate,
        punchTime,
        notes: notes.trim(),
      });
      toast.success('Attendance updated');
      setEdit(null);
      await search();
    } catch (err) {
      toast.error(attendanceError(err, 'Could not update attendance'));
    } finally {
      setBusy(false);
    }
  };

  const rows = data?.rows || [];

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-clipboard-list" /> Attendance Report</h2>
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
        <>
          <div className="qb-kpis">
            <div className="qb-kpi bills">
              <span className="qb-kpi-ico"><i className="fas fa-list" /></span>
              <div>
                <div className="qb-kpi-l">Punches</div>
                <div className="qb-kpi-v">{data.count || 0}</div>
              </div>
            </div>
            <div className="qb-kpi cash">
              <span className="qb-kpi-ico"><i className="fas fa-sign-in-alt" /></span>
              <div>
                <div className="qb-kpi-l">IN</div>
                <div className="qb-kpi-v">{data.inCount || 0}</div>
              </div>
            </div>
            <div className="qb-kpi gpay">
              <span className="qb-kpi-ico"><i className="fas fa-sign-out-alt" /></span>
              <div>
                <div className="qb-kpi-l">OUT</div>
                <div className="qb-kpi-v">{data.outCount || 0}</div>
              </div>
            </div>
            <div className="qb-kpi total">
              <span className="qb-kpi-ico"><i className="fas fa-clock" /></span>
              <div>
                <div className="qb-kpi-l">Hours</div>
                <div className="qb-kpi-v">{formatHours(data.workMinutes)}</div>
              </div>
            </div>
          </div>

          <div className="mst-card">
            <div className="mst-card-h">
              <span>Attendance details</span>
              {rows.length > 0 && <span className="qb-bills-total">{formatHours(data.workMinutes)}</span>}
            </div>
            {rows.length === 0 ? (
              <div className="mst-empty">No attendance found for the selected filters.</div>
            ) : (
              <div className="qb-bills">
                {rows.map((row) => (
                  <article key={row.id} className="qb-bill-card">
                    <div className="qb-bill-top">
                      <strong>{row.punchTime}</strong>
                      <span className={`att-tag ${row.punchType}`}>{row.punchType === 'out' ? 'OUT' : 'IN'}</span>
                    </div>
                    <div className="qb-bill-meta">
                      <span>{row.punchDate}</span>
                      <span>{row.shopName || row.shopId || '—'}</span>
                    </div>
                    <div className="qb-bill-user">{row.userName || '—'}</div>
                    {row.notes ? <p className="qb-bill-notes">{row.notes}</p> : null}
                    <div className="qb-bill-acts">
                      <button className="mst-icon-btn" type="button" onClick={() => openEdit(row)}>
                        <i className="fas fa-edit" /> Edit
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {edit && (
        <div className="qb-modal" onClick={() => setEdit(null)}>
          <div className="qb-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="mst-card-h">Edit attendance</div>
            <div className="mst-card-b">
              <div className="mst-fg" style={{ marginBottom: 10 }}>
                <label>Date</label>
                <input className="mst-inp" type="date" value={punchDate} onChange={(e) => setPunchDate(e.target.value)} />
              </div>
              <div className="mst-fg" style={{ marginBottom: 10 }}>
                <label>Time</label>
                <input className="mst-inp" type="time" value={punchTime} onChange={(e) => setPunchTime(e.target.value)} />
              </div>
              <div className="mst-fg" style={{ marginBottom: 10 }}>
                <label>Notes</label>
                <textarea className="mst-area" rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
              <div className="mst-actions">
                <button className="mst-btn mst-btn-outline" type="button" onClick={() => setEdit(null)}>Close</button>
                <button className="mst-btn mst-btn-primary" type="button" disabled={busy} onClick={saveEdit}>
                  {busy ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceReportPage;
