import { lazy, Suspense, type ReactElement } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import Login from '../login/Login';
import { routerBaseUrl } from '../billingConfig';

const MainLayout = lazy(() => import('../main-layout/MainLayout'));
const AuthGuard = lazy(() => import('../auth-guard/AuthGuard'));
const SidebarProvider = lazy(() =>
  import('../context/SidebarContext').then((m) => ({ default: m.SidebarProvider }))
);
const BillingLayout = lazy(() => import('../billing/BillingLayout'));
const ModuleAccessGuard = lazy(() => import('../billing/components/ModuleAccessGuard'));
const DefaultAppRedirect = lazy(() =>
  import('../billing/components/ModuleAccessGuard').then((m) => ({ default: m.DefaultAppRedirect }))
);
const QuickBillPage = lazy(() => import('../billing/pages/quick-bill/QuickBillPage'));
const TodayCollectionPage = lazy(() => import('../billing/pages/quick-bill/TodayCollectionPage'));
const CollectionReportPage = lazy(() => import('../billing/pages/quick-bill/CollectionReportPage'));
const AttendanceEntryPage = lazy(() => import('../billing/pages/attendance/AttendanceEntryPage'));
const AttendanceReportPage = lazy(() => import('../billing/pages/attendance/AttendanceReportPage'));
const IncentiveEntryPage = lazy(() => import('../billing/pages/incentive/IncentiveEntryPage'));
const IncentiveReportPage = lazy(() => import('../billing/pages/incentive/IncentiveReportPage'));
const CreateUserPage = lazy(() => import('../billing/pages/users/CreateUserPage'));
const ModulePermissionPage = lazy(() => import('../billing/pages/users/PermissionPage'));
const ChangePasswordPage = lazy(() => import('../billing/pages/users/ChangePasswordPage'));
const CompanyDetailsPage = lazy(() => import('../billing/pages/admin/CompanyDetailsPage'));
const EditLogPage = lazy(() => import('../billing/pages/admin/EditLogPage'));

const guard = (element: ReactElement) => <AuthGuard component={element} />;

const AppRouter = () => {
  return (
    <Router basename={routerBaseUrl}>
      <Suspense fallback={<div style={{ padding: 24, textAlign: 'center' }}>Loading…</div>}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            element={guard(
              <SidebarProvider>
                <MainLayout />
              </SidebarProvider>
            )}
          >
            <Route path="/app" element={<BillingLayout />}>
              <Route path="users/change-password" element={<ChangePasswordPage />} />
              <Route element={<ModuleAccessGuard />}>
                <Route path="quick-bill" element={<QuickBillPage />} />
                <Route path="quick-bill/today" element={<TodayCollectionPage />} />
                <Route path="quick-bill/report" element={<CollectionReportPage />} />
                <Route path="attendance" element={<AttendanceEntryPage />} />
                <Route path="attendance/report" element={<AttendanceReportPage />} />
                <Route path="incentive" element={<IncentiveEntryPage />} />
                <Route path="incentive/report" element={<IncentiveReportPage />} />
                <Route path="users/create" element={<CreateUserPage />} />
                <Route path="users/permission" element={<ModulePermissionPage />} />
                <Route path="admin/company-details" element={<CompanyDetailsPage />} />
                <Route path="admin/edit-log" element={<EditLogPage />} />
              </Route>
              <Route index element={<DefaultAppRedirect />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default AppRouter;
