'use client';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/lib/i18n';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface AuthButtonsProps {
  size?: 'default' | 'compact';
}

export function AuthButtons({ size = 'default' }: AuthButtonsProps) {
  const { t } = useTranslations();

  const arrowClass =
    size === 'compact' ? 'h-3 w-3 sm:h-4 sm:w-4 ml-1 sm:ml-2' : 'h-4 w-4 ml-2';

  return (
    <>
      <Link className="text-base font-medium" href="/login">
        <Button size="md" variant="default">
          {t('nav.signIn')}
        </Button>
      </Link>
      <Link className="text-base font-medium" href="/sign-up">
        <Button size="md" variant="default">
          {t('nav.signUp')}
          <ArrowRight className={arrowClass} />
        </Button>
      </Link>
    </>
  );
}
