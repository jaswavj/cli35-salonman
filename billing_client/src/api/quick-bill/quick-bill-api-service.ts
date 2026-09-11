import HttpClientWrapper from '../http-client-wrapper';

export type QuickBillRow = {
  id: number;
  amount: number;
  payMode: string;
  tipsAmount?: number;
  tipsPayMode?: string;
  notes: string;
  shopId: string;
  shopName: string;
  userId: number;
  userName: string;
  billDate: string;
  billTime: string;
  isCancelled?: number;
};

export type QuickBillReport = {
  rows: QuickBillRow[];
  cashTotal: number;
  gpayTotal: number;
  tipsTotal?: number;
  expenseTotal?: number;
  grandTotal: number;
  count: number;
};

export type QuickBillDay = {
  date: string;
  label: string;
  weekday: string;
  today: boolean;
  cash: number;
  gpay: number;
  total: number;
  count: number;
};

export type QuickBillTrend = {
  days: QuickBillDay[];
  cashTotal: number;
  gpayTotal: number;
  grandTotal: number;
  count: number;
};

export type QuickBillAccountRow = {
  userId: number;
  userName: string;
  shopId: string;
  shopName: string;
  cashTotal: number;
  bankTotal: number;
  total: number;
  tipsTotal: number;
  tipsCash?: number;
  tipsBank?: number;
  incentiveEarn: number;
  expenseTotal?: number;
  finalCash: number;
  finalBank: number;
};

export type QuickBillAccounts = {
  rows: QuickBillAccountRow[];
  shopId?: string;
  shopName?: string;
  cashTotal: number;
  bankTotal: number;
  grandTotal: number;
  tipsTotal: number;
  incentiveTotal: number;
  expenseTotal?: number;
  finalCashTotal: number;
  finalBankTotal: number;
  count: number;
};

export type QuickBillLog = {
  id: number;
  billId: number;
  action: string;
  oldAmount: number;
  newAmount: number;
  oldPayMode: string;
  newPayMode: string;
  oldNotes: string;
  newNotes: string;
  reason: string;
  userName: string;
  shopName: string;
  logDate: string;
  logTime: string;
};

export class QuickBillApiService {
  private http = new HttpClientWrapper();

  save = (payload: {
    amount: number;
    payMode: 'cash' | 'gpay';
    tipsAmount?: number;
    tipsPayMode?: string;
    notes: string;
  }) => this.http.post('/v1/quick-bills', payload);

  today = () => this.http.get('/v1/quick-bills/today');

  trend = (opts?: { days?: number; mine?: boolean; userId?: number; shopId?: string }) => {
    const params = new URLSearchParams();
    params.set('days', String(opts?.days ?? 10));
    if (opts?.mine) params.set('mine', 'true');
    if (opts?.userId) params.set('userId', String(opts.userId));
    if (opts?.shopId) params.set('shopId', opts.shopId);
    return this.http.get(`/v1/quick-bills/trend?${params}`);
  };

  report = (from: string, to: string, userId?: number, shopId?: string) => {
    const params = new URLSearchParams({ from, to });
    if (userId) params.set('userId', String(userId));
    if (shopId) params.set('shopId', shopId);
    return this.http.get(`/v1/quick-bills/report?${params}`);
  };

  todayAccounts = () => this.http.get('/v1/quick-bills/accounts/today');

  accounts = (from: string, to: string, shopId: string) => {
    const params = new URLSearchParams({ from, to, shopId });
    return this.http.get(`/v1/quick-bills/accounts?${params}`);
  };

  update = (id: number, payload: {
    amount: number;
    payMode: 'cash' | 'gpay';
    tipsAmount?: number;
    tipsPayMode?: string;
    notes: string;
  }) => this.http.post(`/v1/quick-bills/${id}`, payload);

  cancel = (id: number, reason: string) =>
    this.http.post(`/v1/quick-bills/${id}/cancel`, { reason });

  logs = (from: string, to: string) =>
    this.http.get(`/v1/quick-bills/logs?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
}

export const quickBillApi = new QuickBillApiService();

export const quickBillData = <T>(res: any): T => {
  if (!res?.success) throw new Error(res?.data?.error || 'Request failed');
  return res.data as T;
};

export const quickBillError = (err: any, fallback: string) =>
  err?.response?.data?.data?.error || err?.message || fallback;
