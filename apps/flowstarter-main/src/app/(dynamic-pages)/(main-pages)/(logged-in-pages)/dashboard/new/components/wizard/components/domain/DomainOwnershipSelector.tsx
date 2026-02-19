'use client';

import { Label } from '@/components/ui/label';
import { useTranslations } from '@/lib/i18n';
import { CheckCircle, Server, ShoppingCart } from 'lucide-react';

interface DomainOwnershipSelectorProps {
  disabled: boolean;
  onSelectAction: (value: 'owns' | 'wants-to-buy' | 'hosted') => void;
}

export function DomainOwnershipSelector({
  disabled,
  onSelectAction,
}: DomainOwnershipSelectorProps) {
  const { t } = useTranslations();

  return (
    <div className="space-y-4">
      <Label className="text-[18px] font-medium leading-[normal] text-ui-text-primary">
        {t('domain.config.ownershipQuestion')}
      </Label>
      <p className="text-[16px] font-normal leading-[24px] text-ui-text-secondary">
        {t('domain.config.bestOption')}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-[20px]">
        <button
          onClick={() => onSelectAction('hosted')}
          disabled={disabled}
          className="bg-ui-bg-overlay border-[1.5px] border-ui-border-base border-solid rounded-[12px] p-[16px] text-left flex flex-col items-start gap-[8px] hover:border-ui-border-focus hover:bg-ui-bg-overlay-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-[8px]">
            <div className="bg-ui-accent-purple-light rounded-[8px] p-[6px] flex items-center justify-center">
              <Server className="h-[16px] w-[16px] text-ui-text-dark" />
            </div>
            <span className="text-[16px] font-medium leading-[24px] text-ui-text-primary">
              {t('domain.config.useHosted')}
            </span>
          </div>
          <div className="mt-[4px]">
            <span className="block text-[16px] font-normal leading-[24px] text-ui-text-secondary">
              {t('domain.config.freeSubdomain')}
            </span>
            <span className="mt-[8px] inline-block text-[12px] px-[12px] py-[5px] rounded-[32px] bg-ui-accent-green-bg text-ui-accent-green border border-ui-accent-green/30">
              {t('domain.recommended')}
            </span>
          </div>
        </button>

        <button
          onClick={() => onSelectAction('owns')}
          disabled={disabled}
          className="bg-ui-bg-overlay border-[1.5px] border-ui-border-base border-solid rounded-[12px] p-[16px] text-left flex flex-col items-start gap-[8px] hover:border-ui-accent-purple hover:bg-ui-bg-overlay-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-[8px]">
            <div className="bg-ui-accent-purple rounded-[8px] p-[6px] flex items-center justify-center">
              <CheckCircle className="h-[16px] w-[16px] text-ui-text-primary" />
            </div>
            <span className="text-[16px] font-medium leading-[24px] text-ui-text-primary">
              {t('domain.config.owns')}
            </span>
          </div>
          <span className="text-[16px] font-normal leading-[24px] text-ui-text-secondary">
            {t('domain.config.useExisting')}
          </span>
        </button>

        <button
          onClick={() => onSelectAction('wants-to-buy')}
          disabled={disabled}
          className="bg-ui-bg-overlay border-[1.5px] border-ui-border-base border-solid rounded-[12px] p-[16px] text-left flex flex-col items-start gap-[8px] hover:border-ui-accent-green hover:bg-ui-bg-overlay-hover transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div className="flex items-center gap-[8px]">
            <div className="bg-ui-accent-green rounded-[8px] p-[6px] flex items-center justify-center">
              <ShoppingCart className="h-[16px] w-[16px] text-ui-text-dark" />
            </div>
            <span className="text-[16px] font-medium leading-[24px] text-ui-text-primary">
              {t('domain.config.wantsToBuy')}
            </span>
          </div>
          <span className="text-[16px] font-normal leading-[24px] text-ui-text-secondary">
            {t('domain.config.findAndPurchase')}
          </span>
        </button>
      </div>
    </div>
  );
}
