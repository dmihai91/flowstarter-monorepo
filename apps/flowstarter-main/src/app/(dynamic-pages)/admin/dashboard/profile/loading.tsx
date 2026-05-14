'use client';

import {
  AdminShellLoadingChrome,
  AdminShellPageSkeleton,
} from '../components/AdminSkeletons';

export default function ProfileLoading() {
  return (
    <AdminShellLoadingChrome>
      <AdminShellPageSkeleton variant="list" rows={6} showSearchBar={false} />
    </AdminShellLoadingChrome>
  );
}
