import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  incentiveApi,
  incentiveData,
  incentiveError,
  type CompareType,
  type IncentiveMode,
  type IncentiveRow,
} from '../../../api/incentive/incentive-api-service';
import { usersApi, usersData } from '../../../api/users/users-api-service';
import '../master/Master.css';
import '../quick-bill/QuickBill.css';
import './Incentive.css';

type UserOpt = { id: number; name: string };
type Outlet = { shopId: string; shopName: string };
type UserGroup = { userId: number; userName: string; rules: IncentiveRow[] };

const empty = () => ({
  targetAmount: '',
  compareType: '' as CompareType | '',
  incentiveMode: '' as IncentiveMode | '',
  incentiveValue: '',
});

const n = (v?: number | null) => Number(v || 0).toFixed(2);

const compareLabel = (v?: string | null) =>
  v === 'lt' ? 'Less than' : v === 'gt' ? 'Greater than' : '—';

const incentiveLabel = (row: IncentiveRow) => {
  if (row.id == null) return '—';
  if (row.incentiveMode === 'percent') return `${n(row.incentiveValue)}%`;
  return `₹ ${n(row.incentiveValue)}`;
};

const ruleText = (row: IncentiveRow) =>
  `₹ ${n(row.targetAmount)} ${compareLabel(row.compareType).toLowerCase()} → ${incentiveLabel(row)}`;

const IncentiveEntryPage: React.FC = () => {
  const [shopId, setShopId] = useState('');
  const [userId, setUserId] = useState('');
  const [shops, setShops] = useState<Outlet[]>([]);
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<number | null>(null);
  const [rows, setRows] = useState<IncentiveRow[]>([]);
  const [busy, setBusy] = useState(false);

  const groups = useMemo<UserGroup[]>(() => {
    const map = new Map<number, UserGroup>();
    for (const row of rows) {
      const current = map.get(row.userId) || { userId: row.userId, userName: row.userName, rules: [] };
      if (row.id != null) current.rules.push(row);
      map.set(row.userId, current);
    }
    return [...map.values()];
  }, [rows]);

  const userRules = groups.find((g) => String(g.userId) === userId)?.rules || [];

  const loadList = (id: string) => {
    if (!id) {
      setRows([]);
      return;
    }
    incentiveApi.list(id)
      .then((res) => setRows(incentiveData<IncentiveRow[]>(res) || []))
      .catch(() => setRows([]));
  };

  useEffect(() => {
    usersApi.outlets()
      .then((res) => setShops(usersData<Outlet[]>(res) || []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setUserId('');
    setUsers([]);
    setForm(empty());
    setEditId(null);
    setRows([]);
    if (!shopId) return;
    usersApi.list(shopId)
      .then((res) => setUsers(usersData<UserOpt[]>(res) || []))
      .catch(() => setUsers([]));
    loadList(shopId);
  }, [shopId]);

  const startEdit = (row: IncentiveRow) => {
    if (row.id == null) return;
    setUserId(String(row.userId));
    setEditId(row.id);
    setForm({
      targetAmount: String(row.targetAmount ?? ''),
      compareType: row.compareType === 'lt' ? 'lt' : 'gt',
      incentiveMode: row.incentiveMode === 'percent' ? 'percent' : 'amount',
      incentiveValue: String(row.incentiveValue ?? ''),
    });
  };

  const cancelEdit = () => {
    setEditId(null);
    setForm(empty());
  };

  const onDelete = async (row: IncentiveRow, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (row.id == null) return;
    if (!window.confirm('Delete this incentive condition?')) return;
    setBusy(true);
    try {
      await incentiveApi.delete(row.id);
      toast.success('Incentive deleted');
      if (editId === row.id) cancelEdit();
      loadList(shopId);
    } catch (err) {
      toast.error(incentiveError(err, 'Could not delete incentive'));
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId) {
      toast.warning('Select shop');
      return;
    }
    if (!userId) {
      toast.warning('Select user');
      return;
    }
    const target = parseFloat(form.targetAmount);
    if (!Number.isFinite(target) || target <= 0) {
      toast.warning('Enter a valid target amount');
      return;
    }
    if (form.compareType !== 'lt' && form.compareType !== 'gt') {
      toast.warning('Select less than or greater than');
      return;
    }
    if (form.incentiveMode !== 'amount' && form.incentiveMode !== 'percent') {
      toast.warning('Select amount or percent');
      return;
    }
    const value = parseFloat(form.incentiveValue);
    if (!Number.isFinite(value) || value <= 0) {
      toast.warning('Enter a valid incentive value');
      return;
    }
    if (form.incentiveMode === 'percent' && value > 100) {
      toast.warning('Percent cannot be more than 100');
      return;
    }
    setBusy(true);
    try {
      await incentiveApi.save({
        id: editId || undefined,
        shopId,
        userId: Number(userId),
        targetAmount: target,
        compareType: form.compareType,
        incentiveMode: form.incentiveMode,
        incentiveValue: value,
      });
      toast.success(editId ? 'Condition updated' : 'Condition added');
      cancelEdit();
      loadList(shopId);
    } catch (err) {
      toast.error(incentiveError(err, 'Could not save incentive'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mst-page">
      <h2 className="mst-title"><i className="fas fa-gift" /> Incentive Entry</h2>
      <div className="mst-grid mst-grid-wide">
        <form className="mst-card" onSubmit={onSubmit}>
          <div className="mst-card-h">{editId ? 'Edit condition' : 'Add condition'}</div>
          <div className="mst-card-b mst-form">
            <div className="mst-fg">
              <label>Shop <span className="req">*</span></label>
              <select className="mst-sel" value={shopId} onChange={(e) => setShopId(e.target.value)}>
                <option value="">Select shop</option>
                {shops.map((s) => (
                  <option key={s.shopId} value={s.shopId}>{s.shopName}</option>
                ))}
              </select>
            </div>
            <div className="mst-fg">
              <label>User <span className="req">*</span></label>
              <select
                className="mst-sel"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setForm(empty());
                  setEditId(null);
                }}
                disabled={!shopId}
              >
                <option value="">{shopId ? 'Select user' : 'Select shop first'}</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </div>

            {userId ? (
              <>
                <div className="mst-fg span-2">
                  <label>Target amount <span className="req">*</span></label>
                  <input
                    className="mst-inp"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.targetAmount}
                    onChange={(e) => setForm({ ...form, targetAmount: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="mst-fg span-2">
                  <label>When collection is <span className="req">*</span></label>
                  <div className="qb-pay inc-toggle">
                    <button
                      type="button"
                      className={`qb-pay-btn ${form.compareType === 'lt' ? 'on' : ''}`}
                      onClick={() => setForm({ ...form, compareType: 'lt' })}
                    >
                      Less than target
                    </button>
                    <button
                      type="button"
                      className={`qb-pay-btn ${form.compareType === 'gt' ? 'on' : ''}`}
                      onClick={() => setForm({ ...form, compareType: 'gt' })}
                    >
                      Greater than target
                    </button>
                  </div>
                </div>
                <div className="mst-fg span-2">
                  <label>Incentive type <span className="req">*</span></label>
                  <div className="qb-pay inc-toggle">
                    <button
                      type="button"
                      className={`qb-pay-btn ${form.incentiveMode === 'amount' ? 'on' : ''}`}
                      onClick={() => setForm({ ...form, incentiveMode: 'amount' })}
                    >
                      Amount
                    </button>
                    <button
                      type="button"
                      className={`qb-pay-btn ${form.incentiveMode === 'percent' ? 'on' : ''}`}
                      onClick={() => setForm({ ...form, incentiveMode: 'percent' })}
                    >
                      %
                    </button>
                  </div>
                </div>
                <div className="mst-fg span-2">
                  <label>
                    Incentive {form.incentiveMode === 'percent' ? '%' : 'amount'} <span className="req">*</span>
                  </label>
                  <input
                    className="mst-inp"
                    type="number"
                    min="0"
                    step="0.01"
                    max={form.incentiveMode === 'percent' ? 100 : undefined}
                    value={form.incentiveValue}
                    onChange={(e) => setForm({ ...form, incentiveValue: e.target.value })}
                    placeholder={form.incentiveMode === 'percent' ? '0' : '0.00'}
                  />
                </div>
                <div className="mst-actions" style={{ gridColumn: '1 / -1' }}>
                  {editId ? (
                    <button className="mst-btn mst-btn-outline" type="button" onClick={cancelEdit}>
                      Cancel
                    </button>
                  ) : null}
                  <button className="mst-btn mst-btn-primary" type="submit" disabled={busy}>
                    {busy ? 'Saving…' : editId ? 'Update condition' : 'Add condition'}
                  </button>
                </div>
                {userRules.length > 0 && (
                  <div className="inc-user-rules" style={{ gridColumn: '1 / -1' }}>
                    <div className="mst-card-h" style={{ paddingLeft: 0, paddingRight: 0 }}>This user</div>
                    {userRules.map((row) => (
                      <div key={row.id} className="inc-rule">
                        <span>{ruleText(row)}</span>
                        <span className="qb-bill-acts">
                          <button className="mst-icon-btn" type="button" onClick={() => startEdit(row)}>
                            <i className="fas fa-edit" /> Edit
                          </button>
                          <button className="mst-icon-btn danger" type="button" onClick={(e) => onDelete(row, e)}>
                            <i className="fas fa-trash" /> Delete
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <p className="mst-note" style={{ gridColumn: '1 / -1', margin: 0 }}>
                Choose shop, then user, to add conditions.
              </p>
            )}
          </div>
        </form>
        <div className="mst-card">
          <div className="mst-card-h">Shop users</div>
          {!shopId ? (
            <div className="mst-empty">Select a shop to see users and incentives.</div>
          ) : groups.length === 0 ? (
            <div className="mst-empty">No users found for this shop.</div>
          ) : (
            <div className="inc-cards">
              {groups.map((group) => {
                const selected = String(group.userId) === userId;
                const set = group.rules.length > 0;
                return (
                  <article
                    key={group.userId}
                    className={`qb-bill-card inc-card-item${selected ? ' on' : ''}${set ? '' : ' empty'}`}
                    onClick={() => {
                      if (String(group.userId) === userId) return;
                      setUserId(String(group.userId));
                      setForm(empty());
                      setEditId(null);
                    }}
                  >
                    <div className="qb-bill-top">
                      <strong>{group.userName || '—'}</strong>
                      <span className="att-tag">{set ? `${group.rules.length} rule${group.rules.length === 1 ? '' : 's'}` : 'Not set'}</span>
                    </div>
                    {set ? (
                      <ul className="inc-rule-list">
                        {group.rules.map((row) => (
                          <li key={row.id}>
                            <span>{ruleText(row)}</span>
                            <span className="qb-bill-acts" onClick={(e) => e.stopPropagation()}>
                              <button className="mst-icon-btn" type="button" onClick={() => startEdit(row)}>
                                <i className="fas fa-edit" />
                              </button>
                              <button className="mst-icon-btn danger" type="button" onClick={(e) => onDelete(row, e)}>
                                <i className="fas fa-trash" />
                              </button>
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="qb-bill-meta"><span>No conditions yet</span></div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncentiveEntryPage;
