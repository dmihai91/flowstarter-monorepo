'use client';

import {
  AdminShellLoadingChrome,
  AdminShellPageSkeleton,
} from '../components/AdminSkeletons';

export default function AnalyticsLoading() {
  return (
    <AdminShellLoadingChrome>
      <AdminShellPageSkeleton variant="list" rows={10} showSearchBar={false} />
    </AdminShellLoadingChrome>
  );
}
