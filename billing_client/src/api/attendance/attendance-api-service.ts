import HttpClientWrapper from '../http-client-wrapper';

export type PunchType = 'in' | 'out';

export type AttendanceRow = {
  id: number;
  punchType: PunchType | string;
  notes: string;
  shopId: string;
  shopName: string;
  userId: number;
  userName: string;
  punchDate: string;
  punchTime: string;
  punchDateIso: string;
  punchTimeIso: string;
};

export type AttendanceReport = {
  rows: AttendanceRow[];
  count: number;
  inCount: number;
  outCount: number;
  workMinutes: number;
};

export class AttendanceApiService {
  private http = new HttpClientWrapper();

  save = (payload: { punchType: PunchType; notes: string }) =>
    this.http.post('/v1/attendance', payload);

  today = () => this.http.get('/v1/attendance/today');

  report = (from: string, to: string, userId?: number, shopId?: string) => {
    const params = new URLSearchParams({ from, to });
    if (userId) params.set('userId', String(userId));
    if (shopId) params.set('shopId', shopId);
    return this.http.get(`/v1/attendance/report?${params}`);
  };

  update = (id: number, payload: { punchType: PunchType; punchDate: string; punchTime: string; notes: string }) =>
    this.http.post(`/v1/attendance/${id}`, payload);
}

export const attendanceApi = new AttendanceApiService();

export const attendanceData = <T>(res: any): T => {
  if (!res?.success) throw new Error(res?.data?.error || 'Request failed');
  return res.data as T;
};

export const attendanceError = (err: any, fallback: string) =>
  err?.response?.data?.data?.error || err?.message || fallback;
