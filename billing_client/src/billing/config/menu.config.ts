import { routerPathNames } from '../../routes/routerPathNames';

export interface MenuItemConfig {
  id: string;
  name: string;
  url?: string;
  icon: string;
  moduleId?: number;
  submenus?: MenuItemConfig[];
}

/** user_modules IDs — a menu shows only if the user has that module. */
export const MENU_MODULE = {
  salonBill: 1,
  todayCollection: 2,
  collectionReport: 3,
  attendanceEntry: 4,
  attendanceReport: 5,
  admin: 6,
  incentive: 7,
  incentiveReport: 8,
  expense: 9,
} as const;

export const filterMenuByModules = (items: MenuItemConfig[], moduleIds: number[]): MenuItemConfig[] => {
  const allowed = new Set((moduleIds || []).map(Number));
  return items.filter((item) => item.moduleId == null || allowed.has(item.moduleId));
};

export const hasModuleAccess = (moduleIds: number[] | undefined, moduleId: number): boolean =>
  (moduleIds || []).map(Number).includes(moduleId);

export const billingMenuConfig: MenuItemConfig[] = [
  {
    id: 'salon-new-bill',
    name: 'New Bill',
    icon: 'fas fa-plus',
    url: routerPathNames.quickBill,
    moduleId: MENU_MODULE.salonBill,
  },
  {
    id: 'salon-today',
    name: 'Today Collection',
    icon: 'fas fa-calendar-day',
    url: routerPathNames.todayCollection,
    moduleId: MENU_MODULE.todayCollection,
  },
  {
    id: 'salon-report',
    name: 'Collection Report',
    icon: 'fas fa-chart-line',
    url: routerPathNames.collectionReport,
    moduleId: MENU_MODULE.collectionReport,
  },
  {
    id: 'attendance-entry',
    name: 'Attendance Entry',
    icon: 'fas fa-user-clock',
    url: routerPathNames.attendance,
    moduleId: MENU_MODULE.attendanceEntry,
  },
  {
    id: 'attendance-report',
    name: 'Attendance Report',
    icon: 'fas fa-clipboard-list',
    url: routerPathNames.attendanceReport,
    moduleId: MENU_MODULE.attendanceReport,
  },
  {
    id: 'incentive-entry',
    name: 'Incentive Entry',
    icon: 'fas fa-gift',
    url: routerPathNames.incentive,
    moduleId: MENU_MODULE.incentive,
  },
  {
    id: 'incentive-report',
    name: 'Incentive Report',
    icon: 'fas fa-coins',
    url: routerPathNames.incentiveReport,
    moduleId: MENU_MODULE.incentiveReport,
  },
  {
    id: 'expense',
    name: 'Expense',
    icon: 'fas fa-money-bill-wave',
    url: routerPathNames.expense,
    moduleId: MENU_MODULE.expense,
  },
  {
    id: 'admin',
    name: 'Admin',
    icon: 'fas fa-chart-pie',
    moduleId: MENU_MODULE.admin,
    submenus: [
      { id: 'company-details', name: 'Company Details', url: routerPathNames.admin.companyDetails, icon: 'fas fa-building' },
      { id: 'create-user', name: 'Create User', url: routerPathNames.users.create, icon: 'fas fa-user-plus' },
      { id: 'permission', name: 'Edit User / Permission', url: routerPathNames.users.permission, icon: 'fas fa-user-edit' },
      { id: 'edit-log', name: 'Edit Log', url: routerPathNames.admin.editLog, icon: 'fas fa-history' },
    ],
  },
];

const firstAllowedPath = (moduleIds?: number[]): string => {
  const allowed = new Set((moduleIds || []).map(Number));
  for (const item of billingMenuConfig) {
    if (item.moduleId != null && !allowed.has(item.moduleId)) continue;
    if (item.url) return item.url;
    const sub = item.submenus?.find((s) => s.url);
    if (sub?.url) return sub.url;
  }
  return routerPathNames.quickBill;
};

/** After login: first menu the user is allowed to open. */
export const defaultAppPath = (moduleIds?: number[]): string => firstAllowedPath(moduleIds);

export const moduleIdForPath = (pathname: string): number | null => {
  if (pathname.includes('/app/users/change-password')) return null;
  if (pathname.includes('/app/quick-bill/today')) return MENU_MODULE.todayCollection;
  if (pathname.includes('/app/quick-bill/report')) return MENU_MODULE.collectionReport;
  if (pathname.includes('/app/quick-bill')) return MENU_MODULE.salonBill;
  if (pathname.includes('/app/attendance/report')) return MENU_MODULE.attendanceReport;
  if (pathname.includes('/app/attendance')) return MENU_MODULE.attendanceEntry;
  if (pathname.includes('/app/incentive/report')) return MENU_MODULE.incentiveReport;
  if (pathname.includes('/app/incentive')) return MENU_MODULE.incentive;
  if (pathname.includes('/app/expense')) return MENU_MODULE.expense;
  if (pathname.includes('/app/users')) return MENU_MODULE.admin;
  if (pathname.includes('/app/admin')) return MENU_MODULE.admin;
  return null;
};
