import { redirect } from 'next/navigation';

type AdminIndexProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function serializeSearchParams(
  params: Record<string, string | string[] | undefined>
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) qs.append(key, v);
    } else {
      qs.append(key, value);
    }
  }
  return qs.toString();
}

/** Forwards query (e.g. `redirect_url`, `next`) so `/admin?…` matches `/admin/login?…`. */
export default async function TeamPage({ searchParams }: AdminIndexProps) {
  const sp = await searchParams;
  const suffix = serializeSearchParams(sp);
  redirect(suffix ? `/admin/login?${suffix}` : '/admin/login');
}
