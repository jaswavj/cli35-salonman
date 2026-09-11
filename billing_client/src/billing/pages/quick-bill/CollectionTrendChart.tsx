import React, { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { QuickBillTrend } from '../../../api/quick-bill/quick-bill-api-service';

const CASH = '#22c55e';
const GPAY = '#6366f1';
const CASH_TODAY = '#15803d';
const GPAY_TODAY = '#4338ca';

const money = (v?: number | null) =>
  Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const money2 = (v?: number | null) =>
  Number(v || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const compact = (v: number) => {
  const abs = Math.abs(v);
  if (abs >= 100000) return `${(v / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
};

type Props = {
  data: QuickBillTrend | null;
  title: string;
  subtitle: string;
  loading?: boolean;
};

const ChartTip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  return (
    <div className="qb-trend-tip">
      <div className="qb-trend-tip-d">
        {row?.weekday} {row?.label}{row?.today ? ' · Today' : ''}
      </div>
      <div className="qb-trend-tip-row"><i style={{ background: CASH }} /> Cash ₹ {money2(row?.cash)}</div>
      <div className="qb-trend-tip-row"><i style={{ background: GPAY }} /> GPay ₹ {money2(row?.gpay)}</div>
      <div className="qb-trend-tip-row strong">Total ₹ {money2(row?.total)} · {row?.count || 0} bills</div>
    </div>
  );
};

const CollectionTrendChart: React.FC<Props> = ({ data, title, subtitle, loading }) => {
  const days = data?.days || [];
  const [narrow, setNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 640px)').matches
  );
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const onChange = () => setNarrow(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  const peak = useMemo(
    () => days.reduce<(typeof days)[number] | null>((best, d) => (
      !best || Number(d.total || 0) > Number(best.total || 0) ? d : best
    ), null),
    [days]
  );

  return (
    <section className="qb-trend">
      <div className="qb-trend-h">
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
        <div className="qb-trend-legend" aria-hidden="true">
          <span><i style={{ background: CASH }} /> Cash</span>
          <span><i style={{ background: GPAY }} /> GPay</span>
        </div>
      </div>

      <div className="qb-trend-stats">
        <div className="qb-trend-stat">
          <em>10-day total</em>
          <strong>₹ {money(data?.grandTotal)}</strong>
        </div>
        <div className="qb-trend-stat">
          <em>Bills</em>
          <strong>{data?.count || 0}</strong>
        </div>
        <div className="qb-trend-stat peak">
          <em>Best day</em>
          <strong>
            {peak && Number(peak.total || 0) > 0
              ? `${peak.label} · ₹ ${money(peak.total)}`
              : '—'}
          </strong>
        </div>
      </div>

      <div className="qb-trend-chart">
        {loading && !data ? (
          <div className="qb-trend-empty">Loading graph…</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={days} margin={{ top: 8, right: 6, left: -18, bottom: 2 }} barCategoryGap="18%">
              <CartesianGrid vertical={false} stroke="#d7e2ec" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                interval={0}
                tickLine={false}
                axisLine={false}
                tick={({ x, y, payload }) => {
                  const day = days.find((d) => d.date === payload.value);
                  const today = !!day?.today;
                  return (
                    <g transform={`translate(${x},${y})`}>
                      <text textAnchor="middle" fill={today ? 'var(--color-primary)' : 'var(--color-text-muted)'}>
                        {!narrow && (
                          <tspan x="0" dy="11" fontSize="10" fontWeight={today ? 800 : 650}>
                            {day?.weekday || ''}
                          </tspan>
                        )}
                        <tspan x="0" dy={narrow ? 12 : 13} fontSize={narrow ? 11 : 11} fontWeight={today ? 800 : 700}>
                          {day?.label?.slice(0, 2) || ''}
                        </tspan>
                      </text>
                    </g>
                  );
                }}
                height={narrow ? 24 : 36}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                width={46}
                tick={{ fill: 'var(--color-text-muted)', fontSize: 10, fontWeight: 650 }}
                tickFormatter={(v) => compact(Number(v || 0))}
              />
              <Tooltip cursor={{ fill: 'rgba(15, 76, 129, 0.08)' }} content={<ChartTip />} wrapperStyle={{ zIndex: 8 }} />
              <Bar dataKey="cash" stackId="pay" name="Cash" maxBarSize={28} radius={[0, 0, 0, 0]}>
                {days.map((d) => (
                  <Cell key={`c-${d.date}`} fill={d.today ? CASH_TODAY : CASH} />
                ))}
              </Bar>
              <Bar dataKey="gpay" stackId="pay" name="GPay" maxBarSize={28} radius={[7, 7, 0, 0]}>
                {days.map((d) => (
                  <Cell key={`g-${d.date}`} fill={d.today ? GPAY_TODAY : GPAY} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  );
};

export default CollectionTrendChart;
