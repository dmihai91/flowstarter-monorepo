'use client';

import { CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { FlowBackground } from '@flowstarter/flow-design-system';
import { SupportHeader } from '@/components/SupportHeader';
import Footer from '@/components/Footer';
import { useTranslations } from '@/lib/i18n';

type ServiceStatus = 'operational' | 'degraded' | 'outage';

function StatusBadge({ status }: { status: ServiceStatus }) {
  const config = {
    operational: {
      icon: CheckCircle2,
      label: 'Operational',
      cls: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    },
    degraded: {
      icon: AlertTriangle,
      label: 'Degraded',
      cls: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20',
    },
    outage: {
      icon: XCircle,
      label: 'Outage',
      cls: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    },
  } as const;
  const { icon: Icon, label, cls } = config[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-2.5 py-1 rounded-full ${cls}`}>
      <Icon className="w-4 h-4" />
      {label}
    </span>
  );
}

export default function StatusPage() {
  const { t } = useTranslations();

  const services: { name: string; status: ServiceStatus }[] = [
    { name: t('status.services.website'), status: 'operational' },
    { name: t('status.services.editor'), status: 'operational' },
    { name: t('status.services.api'), status: 'operational' },
    { name: t('status.services.auth'), status: 'operational' },
    { name: t('status.services.hosting'), status: 'operational' },
  ];

  const allOperational = services.every((s) => s.status === 'operational');

  return (
    <div className="relative flex min-h-screen flex-col page-gradient">
      <FlowBackground
        variant="dashboard"
        style={{ position: 'fixed', inset: 0, zIndex: 0 }}
      />
      <SupportHeader />

      <main className="relative z-10 flex-1 w-full mx-auto">
        {/* Hero */}
        <section className="pt-28 pb-12 md:pt-36 md:pb-16 text-center">
          <div className="max-w-3xl mx-auto px-4">
            <div className="w-24 h-2 bg-[--purple-primary] rounded-full mb-6 mx-auto" />
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl mb-4 text-foreground">
              {t('status.title')}
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              {t('status.subtitle')}
            </p>
          </div>
        </section>

        {/* Overall status */}
        <section className="pb-20 px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            {/* Banner */}
            <div
              className={`rounded-2xl p-6 text-center font-semibold text-lg ${
                allOperational
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border border-green-200/50 dark:border-green-500/20'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-500/20'
              }`}
            >
              {allOperational
                ? t('status.allOperational')
                : t('status.someIssues')}
            </div>

            {/* Service list */}
            <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-sm rounded-2xl border border-[--purple-primary]/30 shadow-xl overflow-hidden">
              {services.map((service, i) => (
                <div
                  key={service.name}
                  className={`flex items-center justify-between px-6 py-4 ${
                    i < services.length - 1
                      ? 'border-b border-gray-200/50 dark:border-white/10'
                      : ''
                  }`}
                >
                  <span className="font-medium text-foreground">
                    {service.name}
                  </span>
                  <StatusBadge status={service.status} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
