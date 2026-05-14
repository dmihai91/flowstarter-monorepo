'use client';

import {
  AdminProjectDetailSkeleton,
  AdminShellLoadingChrome,
} from '../../components/AdminSkeletons';

export default function ProjectDetailLoading() {
  return (
    <AdminShellLoadingChrome>
      <AdminProjectDetailSkeleton />
    </AdminShellLoadingChrome>
  );
}
