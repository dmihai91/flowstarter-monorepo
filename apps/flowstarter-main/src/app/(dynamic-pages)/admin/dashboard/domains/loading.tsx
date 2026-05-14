'use client';

import {
  AdminShellLoadingChrome,
  AdminShellPageSkeleton,
} from '../components/AdminSkeletons';

export default function DomainsLoading() {
  return (
    <AdminShellLoadingChrome>
      <AdminShellPageSkeleton variant="list" rows={8} showSearchBar={false} />
    </AdminShellLoadingChrome>
  );
}
