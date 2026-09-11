import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  quickBillApi,
  quickBillData,
  quickBillError,
  type QuickBillReport,
  type QuickBillTrend,
} from '../../../api/quick-bill/quick-bill-api-service';
import {
  incentiveApi,
  incentiveData,
  type IncentiveProgress,
} from '../../../api/incentive/incentive-api-service';
import '../master/Master.css';
import '../credit/Credit.css';
import './QuickBill.css';
import '../incentive/Incentive.css';
import CollectionDetails from './CollectionDetails';
import CollectionTrendChart from './CollectionTrendChart';

const n = (v?: number | null) => Number(v || 0).toFixed(2);

const TodayCollectionPage: React.FC = () => {
  const [data, setData] = useState<QuickBillReport | null>(null);
  const [trend, setTrend] = useState<QuickBillTrend | null>(null);
  const [progress, setProgress] = useState<IncentiveProgress | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const [reportRes, trendRes] = await Promise.all([
        quickBillApi.today(),
        quickBillApi.trend({ days: 10, mine: true }).catch(() => null),
      ]);
      setData(quickBillData<QuickBillReport>(reportRes));
      try {
        setTrend(trendRes ? quickBillData<QuickBillTrend>(trendRes) : null);
      } catch {
        setTrend(null);
      }
      try {
        setProgress(incentiveData<IncentiveProgress>(await incentiveApi.today()));
      } catch {
        setProgress(null);
      }
    } catch (err) {
      toast.error(quickBillError(err, 'Could not load today collection'));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="mst-page qb-report-page">
      <div className="qb-report-head">
        <h2 className="mst-title"><i className="fas fa-calendar-day" /> Today Collection</h2>
        <button className="mst-btn mst-btn-outline" type="button" onClick={load} disabled={busy}>
          {busy ? 'Loading…' : 'Refresh'}
        </button>
      </div>
      <p className="qb-report-sub">Your entries for this shop today.</p>
      {progress && (
        <article className="inc-today-card">
          <div className="inc-today-item">
            <span className="inc-today-l">Incentive earn</span>
            <strong>₹ {n(progress.incentiveEarn)}</strong>
          </div>
          <div className="inc-today-item">
            <span className="inc-today-l">To next incentive</span>
            <strong>
              {progress.nextTarget != null
                ? `₹ ${n(progress.toNext)}`
                : '—'}
            </strong>
            {progress.nextTarget != null && (
              <span className="inc-today-s">Target ₹ {n(progress.nextTarget)}</span>
            )}
          </div>
        </article>
      )}
      {data && (
        <CollectionDetails data={data} emptyText="No collection entered today." section="kpis" />
      )}
      <CollectionTrendChart
        data={trend}
        loading={busy && !trend}
        title="Last 10 days"
        subtitle="Your collection by day for this shop"
      />
      {data && (
        <CollectionDetails data={data} emptyText="No collection entered today." section="bills" />
      )}
    </div>
  );
};

export default TodayCollectionPage;
