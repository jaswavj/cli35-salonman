import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import {
  quickBillApi,
  quickBillData,
  quickBillError,
  type QuickBillAccounts,
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
import CollectionDetails from './CollectionDetails';
import CollectionTrendChart from './CollectionTrendChart';
import CollectionTabs, { type CollectionTab } from './CollectionTabs';
import CollectionAccounts from './CollectionAccounts';

const TodayCollectionPage: React.FC = () => {
  const [tab, setTab] = useState<CollectionTab>('collection');
  const [data, setData] = useState<QuickBillReport | null>(null);
  const [accounts, setAccounts] = useState<QuickBillAccounts | null>(null);
  const [trend, setTrend] = useState<QuickBillTrend | null>(null);
  const [progress, setProgress] = useState<IncentiveProgress | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setBusy(true);
    try {
      const [reportRes, trendRes, accountsRes] = await Promise.all([
        quickBillApi.today(),
        quickBillApi.trend({ days: 10, mine: true }).catch(() => null),
        quickBillApi.todayAccounts().catch(() => null),
      ]);
      setData(quickBillData<QuickBillReport>(reportRes));
      try {
        setTrend(trendRes ? quickBillData<QuickBillTrend>(trendRes) : null);
      } catch {
        setTrend(null);
      }
      try {
        setAccounts(accountsRes ? quickBillData<QuickBillAccounts>(accountsRes) : null);
      } catch {
        setAccounts(null);
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
      <p className="qb-report-sub">
        {tab === 'accounts'
          ? 'All users in your shop today.'
          : 'Your entries for this shop today.'}
      </p>
      <CollectionTabs tab={tab} onChange={setTab} />

      {tab === 'collection' && (
        <>
          {data && (
            <CollectionDetails
              data={data}
              emptyText="No collection entered today."
              section="kpis"
              incentiveEarn={progress?.incentiveEarn || 0}
              nextTarget={progress?.nextTarget}
              toNext={progress?.toNext}
            />
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
        </>
      )}

      {tab === 'accounts' && (
        accounts
          ? <CollectionAccounts data={accounts} emptyText="No users found for this shop." />
          : <div className="mst-empty">{busy ? 'Loading…' : 'Could not load accounts.'}</div>
      )}
    </div>
  );
};

export default TodayCollectionPage;
