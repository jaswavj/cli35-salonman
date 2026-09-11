import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  attendanceApi,
  attendanceData,
  attendanceError,
  type AttendanceReport,
  type AttendanceRow,
  type PunchType,
} from '../../../api/attendance/attendance-api-service';
import '../quick-bill/QuickBill.css';
import './Attendance.css';

const formatHours = (minutes?: number) => {
  const m = Math.max(0, Number(minutes || 0));
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}h ${String(min).padStart(2, '0')}m`;
};

const AttendanceEntryPage: React.FC = () => {
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [now, setNow] = useState(new Date());
  const [data, setData] = useState<AttendanceReport | null>(null);

  const loadToday = useCallback(async () => {
    try {
      setData(attendanceData<AttendanceReport>(await attendanceApi.today()));
    } catch (err) {
      toast.error(attendanceError(err, 'Could not load today attendance'));
    }
  }, []);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const punch = async (punchType: PunchType) => {
    setBusy(true);
    try {
      await attendanceApi.save({ punchType, notes: notes.trim() });
      toast.success(punchType === 'in' ? 'IN recorded' : 'OUT recorded');
      setNotes('');
      await loadToday();
    } catch (err) {
      toast.error(attendanceError(err, 'Could not save attendance'));
    } finally {
      setBusy(false);
    }
  };

  const rows = data?.rows || [];
  const last = rows.length ? rows[rows.length - 1] : null;
  const lastIsIn = last?.punchType === 'in';
  const canIn = !lastIsIn;
  const canOut = lastIsIn;
  const clock = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="qb-page">
      <div className="qb-card att-card">
        <header className="qb-head">
          <h2>Attendance Entry</h2>
          <p>Punch IN, then OUT. Repeat through the day.</p>
        </header>

        <div className="att-clock">{clock}</div>

        {last && (
          <div className={`att-last ${last.punchType}`}>
            Last punch: <strong>{last.punchType === 'out' ? 'OUT' : 'IN'}</strong> at {last.punchTime}
          </div>
        )}

        <div className="qb-pay att-pay">
          <button
            type="button"
            className={`qb-pay-btn att-in ${canIn ? 'on' : ''}`}
            disabled={busy || !canIn}
            onClick={() => punch('in')}
          >
            <i className="fas fa-sign-in-alt" />
            IN
          </button>
          <button
            type="button"
            className={`qb-pay-btn att-out ${canOut ? 'on' : ''}`}
            disabled={busy || !canOut}
            onClick={() => punch('out')}
          >
            <i className="fas fa-sign-out-alt" />
            OUT
          </button>
        </div>

        <label className="qb-label" htmlFor="att-notes">Notes</label>
        <textarea
          id="att-notes"
          className="qb-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional notes"
        />

        <div className="att-today">
          <div className="att-today-h">
            <span>Today</span>
            <span>{formatHours(data?.workMinutes)} · {rows.length} punch{rows.length === 1 ? '' : 'es'}</span>
          </div>
          {rows.length === 0 ? (
            <p className="att-empty">No punches yet today.</p>
          ) : (
            <ul className="att-list">
              {rows.map((row: AttendanceRow) => (
                <li key={row.id} className={row.punchType}>
                  <span className={`att-tag ${row.punchType}`}>{row.punchType === 'out' ? 'OUT' : 'IN'}</span>
                  <span className="att-time">{row.punchTime}</span>
                  {row.notes ? <span className="att-note">{row.notes}</span> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceEntryPage;
