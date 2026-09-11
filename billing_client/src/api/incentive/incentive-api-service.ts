import HttpClientWrapper from '../http-client-wrapper';

export type CompareType = 'lt' | 'gt';
export type IncentiveMode = 'amount' | 'percent';

export type IncentiveRow = {
  id?: number | null;
  shopId: string;
  shopName: string;
  userId: number;
  userName: string;
  targetAmount?: number | null;
  compareType?: CompareType | string | null;
  incentiveMode?: IncentiveMode | string | null;
  incentiveValue?: number | null;
};

export type IncentiveProgress = {
  userId: number;
  userName: string;
  shopId: string;
  shopName: string;
  collection: number;
  target?: number | null;
  incentiveEarn: number;
  nextTarget?: number | null;
  toNext: number;
};

export type IncentiveReport = {
  rows: IncentiveProgress[];
  collectionTotal: number;
  incentiveTotal: number;
  count: number;
};

export class IncentiveApiService {
  private http = new HttpClientWrapper();

  get = (shopId: string, userId: number) =>
    this.http.get(`/v1/incentives?shopId=${encodeURIComponent(shopId)}&userId=${userId}`);

  list = (shopId: string) =>
    this.http.get(`/v1/incentives/list?shopId=${encodeURIComponent(shopId)}`);

  today = () => this.http.get('/v1/incentives/today');

  report = (from: string, to: string, userId?: number, shopId?: string) => {
    const params = new URLSearchParams({ from, to });
    if (userId) params.set('userId', String(userId));
    if (shopId) params.set('shopId', shopId);
    return this.http.get(`/v1/incentives/report?${params}`);
  };

  save = (payload: {
    id?: number;
    shopId: string;
    userId: number;
    targetAmount: number;
    compareType: CompareType;
    incentiveMode: IncentiveMode;
    incentiveValue: number;
  }) => this.http.post('/v1/incentives', payload);

  delete = (id: number) => this.http.post(`/v1/incentives/${id}/delete`, {});
}

export const incentiveApi = new IncentiveApiService();

export const incentiveData = <T>(res: any): T => {
  if (!res?.success) throw new Error(res?.data?.error || 'Request failed');
  return res.data as T;
};

export const incentiveError = (err: any, fallback: string) =>
  err?.response?.data?.data?.error || err?.message || fallback;
