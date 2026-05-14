'use client';

import {
  AdminShellLoadingChrome,
  AdminShellPageSkeleton,
} from '../components/AdminSkeletons';

export default function TeamLoading() {
  return (
    <AdminShellLoadingChrome>
      <AdminShellPageSkeleton variant="cards" rows={6} />
    </AdminShellLoadingChrome>
  );
}
