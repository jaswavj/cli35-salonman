import * as XLSX from 'xlsx';
import type { QuickBillAccounts, QuickBillReport } from '../../../api/quick-bill/quick-bill-api-service';

const n = (v?: number) => Number(v || 0);
const money = (v?: number) => Number(Number(v || 0).toFixed(2));
const payLabel = (mode?: string) => (mode === 'gpay' ? 'GPay' : mode === 'cash' ? 'Cash' : mode || '—');

type FilterMeta = {
  from: string;
  to: string;
  shopName: string;
  userName?: string;
};

const writeBook = (sheets: { name: string; rows: (string | number)[][] }[], filename: string) => {
  const wb = XLSX.utils.book_new();
  sheets.forEach((sheet) => {
    const ws = XLSX.utils.aoa_to_sheet(sheet.rows);
    ws['!cols'] = sheet.rows[0]?.map((_, col) => {
      const width = sheet.rows.reduce((max, row) => Math.max(max, String(row[col] ?? '').length), 10);
      return { wch: Math.min(Math.max(width + 2, 12), 36) };
    });
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31));
  });
  XLSX.writeFile(wb, filename);
};

export const downloadCollectionXlsx = (data: QuickBillReport, incentiveEarn: number, meta: FilterMeta) => {
  const rows = data.rows || [];
  const tipsCash = rows.reduce((sum, row) => {
    if (row.isCancelled === 1 || n(row.tipsAmount) <= 0) return sum;
    return row.tipsPayMode === 'gpay' ? sum : sum + n(row.tipsAmount);
  }, 0);
  const tipsGpay = rows.reduce((sum, row) => {
    if (row.isCancelled === 1 || n(row.tipsAmount) <= 0) return sum;
    return row.tipsPayMode === 'gpay' ? sum + n(row.tipsAmount) : sum;
  }, 0);
  const incentive = n(incentiveEarn);
  const expense = n(data.expenseTotal);
  const finalCash = n(data.cashTotal) - tipsCash - tipsGpay - incentive - expense;
  const finalBank = n(data.gpayTotal);

  writeBook(
    [
      {
        name: 'Summary',
        rows: [
          ['Collection Report'],
          ['From', meta.from],
          ['To', meta.to],
          ['Shop', meta.shopName],
          ['User', meta.userName || 'All Users'],
          [],
          ['Bills', data.count || 0],
          ['Cash (including tips)', money(data.cashTotal)],
          ['GPay (including tips)', money(data.gpayTotal)],
          ['Total', money(data.grandTotal)],
          ['Tips', money(data.tipsTotal)],
          ['Tips Cash', money(tipsCash)],
          ['Tips GPay', money(tipsGpay)],
          ['Incentive', money(incentive)],
          ['Expense', money(expense)],
          ['Final Cash', money(finalCash)],
          ['Final Bank', money(finalBank)],
        ],
      },
      {
        name: 'Bills',
        rows: [
          ['Date', 'Time', 'Shop', 'User', 'Amount', 'Pay Mode', 'Tips', 'Tips Mode', 'Status'],
          ...rows.map((row) => [
            row.billDate || '',
            row.billTime || '',
            row.shopName || row.shopId || '',
            row.userName || '',
            money(row.amount),
            payLabel(row.payMode),
            money(row.tipsAmount),
            n(row.tipsAmount) > 0 ? payLabel(row.tipsPayMode) : '',
            row.isCancelled === 1 ? 'Cancelled' : 'Active',
          ]),
        ],
      },
    ],
    `collection-report-${meta.from}-to-${meta.to}.xlsx`
  );
};

export const downloadAccountsXlsx = (data: QuickBillAccounts, meta: FilterMeta) => {
  const rows = data.rows || [];
  writeBook(
    [
      {
        name: 'Summary',
        rows: [
          ['Accounts Report'],
          ['From', meta.from],
          ['To', meta.to],
          ['Shop', data.shopName || meta.shopName],
          [],
          ['Users', data.count || 0],
          ['Cash', money(data.cashTotal)],
          ['Bank', money(data.bankTotal)],
          ['Total', money(data.grandTotal)],
          ['Tips', money(data.tipsTotal)],
          ['Incentive', money(data.incentiveTotal)],
          ['Expense', money(data.expenseTotal)],
          ['Final Cash', money(data.finalCashTotal)],
          ['Final Bank', money(data.finalBankTotal)],
        ],
      },
      {
        name: 'Accounts',
        rows: [
          ['User', 'Cash', 'Bank', 'Total', 'Tips', 'Incentive', 'Expense', 'Final Cash', 'Final Bank'],
          ...rows.map((row) => [
            row.userName || '',
            money(row.cashTotal),
            money(row.bankTotal),
            money(row.total),
            money(row.tipsTotal),
            money(row.incentiveEarn),
            money(row.expenseTotal),
            money(row.finalCash),
            money(row.finalBank),
          ]),
          [
            'Total',
            money(data.cashTotal),
            money(data.bankTotal),
            money(data.grandTotal),
            money(data.tipsTotal),
            money(data.incentiveTotal),
            money(data.expenseTotal),
            money(data.finalCashTotal),
            money(data.finalBankTotal),
          ],
        ],
      },
    ],
    `accounts-report-${meta.from}-to-${meta.to}.xlsx`
  );
};
