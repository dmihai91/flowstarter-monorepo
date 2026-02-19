'use client';

import { Card } from '@/components/ui/card';
import { useTranslations } from '@/lib/i18n';
import { Lightbulb } from 'lucide-react';

export function ExamplesHeader() {
  const { t } = useTranslations();

  return (
    <Card>
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
          <Lightbulb className="h-7 w-7 text-primary" />
        </div>
        <div className="space-y-1.5 flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {t('examples.title')}
          </h1>
          <p className="text-muted-foreground max-w-2xl text-sm">
            {t('examples.subtitle')}
          </p>
        </div>
      </div>
    </Card>
  );
}
