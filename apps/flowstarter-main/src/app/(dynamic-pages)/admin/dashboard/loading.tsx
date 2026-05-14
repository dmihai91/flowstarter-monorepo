'use client';

import {
  AdminDashboardLoadingChrome,
  AdminDashboardPageSkeleton,
} from './components/AdminSkeletons';

export default function TeamDashboardLoading() {
  return (
    <AdminDashboardLoadingChrome>
      <AdminDashboardPageSkeleton />
    </AdminDashboardLoadingChrome>
  );
}
